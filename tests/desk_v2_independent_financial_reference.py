#!/usr/bin/env python3
"""Cross-language, independently constructed release checks of V2's stated financial contract.

Python uses no calculator JS formulas or code imports. Node is invoked *only* to
obtain observed V2 outputs. Tests are assurance of arithmetic under the declared
annual-flow conventions, NOT a third-party institutional underwriting approval.
"""
import json, math, pathlib, subprocess, unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]
DEFAULT={"value":8000000,"noi":520000,"payoff":5600000,"costs":180000,
 "reserves":0,"rate":7.5,"amortYears":25,"dscrMin":1.25,
 "ltvMax":65,"debtYieldMin":9}
INV={"purchasePrice":8000000,"acquisitionCosts":150000,"holdYears":5,
 "noiGrowthPct":2,"exitCapRatePct":6.5,"saleCostPct":2,
 "discountRatePct":10,"debtMode":"modeled","customPrincipal":3000000}
WAT={"lpContributionPct":90,"preferredReturnPct":8,"lpResidualPct":70,
 "cumulative":True,"compound":False}

def observed(shared=DEFAULT,investment=INV,waterfall=None):
    payload=json.dumps({"shared":shared,"investment":investment,"waterfall":waterfall})
    script=r"""
const fs=require('fs');
const p=JSON.parse(fs.readFileSync(0,'utf8'));
const I=require('./tools/commercial-real-estate-loan-calculator/investment.js');
const W=require('./tools/commercial-real-estate-loan-calculator/waterfall.js');
const x=I.analyze(p.shared,p.investment);
const out={principal:x.principal,initialEquity:x.initialEquity,
 cashflows:x.cashflows,rows:x.rows,netExitEquity:x.netExitEquity,
 exitDebtPayoff:x.exitDebtPayoff,exitValue:x.exitValue,
 npv:x.npv,irr:x.irr,equityMultiple:x.equityMultiple,
 waterfall:p.waterfall?W.build(x,p.waterfall):null};
process.stdout.write(JSON.stringify(out));
"""
    r=subprocess.run(["node","-e",script],input=payload,text=True,cwd=ROOT,
                     capture_output=True,check=True)
    return json.loads(r.stdout)

def independent_model(shared,inv):
    # Positive monthly rate calculated from user-entered nominal annual percent.
    monthly_rate=shared["rate"]/1200
    amort_months=round(shared["amortYears"]*12)
    factor=(monthly_rate/(1-(1+monthly_rate)**(-amort_months))
            if monthly_rate else 1/amort_months)
    debt=min(shared["noi"]/(shared["dscrMin"]*12*factor),
             shared["value"]*shared["ltvMax"]/100,
             shared["noi"]/(shared["debtYieldMin"]/100))
    mode=inv["debtMode"]
    principal={"modeled":debt,"custom":inv["customPrincipal"],"none":0}[mode]
    initial=inv["purchasePrice"]+inv["acquisitionCosts"]-principal
    monthly_payment=principal*factor
    balance=principal
    flows=[-initial]; rows=[]
    for yr in range(1,inv["holdYears"]+1):
        year_service=0
        for mo in range(12):
            if (yr-1)*12+mo >= amort_months:continue
            interest=balance*monthly_rate
            principal_paid=min(balance,max(0,monthly_payment-interest))
            balance=max(0,balance-principal_paid)
            year_service+=monthly_payment
        income=shared["noi"]*(1+inv["noiGrowthPct"]/100)**(yr-1)
        operating=income-year_service
        terminal=(income*(1+inv["noiGrowthPct"]/100)/
                  (inv["exitCapRatePct"]/100)) if yr==inv["holdYears"] else 0
        exit_equity=terminal*(1-inv["saleCostPct"]/100)-balance if terminal else 0
        total=operating+exit_equity
        flows.append(total)
        rows.append({"year":yr,"noi":income,"annualDebtService":year_service,
                     "endingDebt":balance,"exitValue":terminal,
                     "exitNetToEquity":exit_equity,"netCash":total})
    npv=sum(f/(1+inv["discountRatePct"]/100)**idx for idx,f in enumerate(flows))
    multiple=(sum(max(0,f) for f in flows)/
              sum(max(0,-f) for f in flows))
    return {"principal":principal,"initialEquity":initial,
            "cashflows":flows,"rows":rows,"exitValue":rows[-1]["exitValue"],
            "exitDebtPayoff":rows[-1]["endingDebt"],
            "netExitEquity":rows[-1]["exitNetToEquity"],
            "npv":npv,"equityMultiple":multiple}

def independent_waterfall(flows,cfg):
    lp_ratio=cfg["lpContributionPct"]/100
    residual=cfg["lpResidualPct"]/100
    pref=cfg["preferredReturnPct"]/100
    lp_out=-flows[0]*lp_ratio
    gp_out=-flows[0]*(1-lp_ratio)
    carry=0
    rows=[]
    for yr,f in enumerate(flows[1:],start=1):
        due=lp_out*pref+(carry*(1+pref if cfg["compound"] else 1)
                          if cfg["cumulative"] else 0)
        avail=max(f,0)
        pay_pref=min(avail,due)
        avail-=pay_pref
        basis=lp_out+gp_out
        capital_return=min(avail,basis)
        lp_cap=capital_return*lp_out/basis if basis else 0
        gp_cap=capital_return-lp_cap
        lp_out-=lp_cap;gp_out-=gp_cap
        avail-=capital_return
        lp_profit=avail*residual
        gp_profit=avail-lp_profit
        lp_call=max(0,-f)*lp_ratio
        gp_call=max(0,-f)*(1-lp_ratio)
        lp_out+=lp_call;gp_out+=gp_call
        carry=max(0,due-pay_pref) if cfg["cumulative"] else 0
        rows.append({"year":yr,"lpPrefPaid":pay_pref,
                     "lpCapitalReturned":lp_cap,"gpCapitalReturned":gp_cap,
                     "lpProfit":lp_profit,"gpProfit":gp_profit,
                     "lpDistribution":pay_pref+lp_cap+lp_profit,
                     "gpDistribution":gp_cap+gp_profit,
                     "lpCall":lp_call,"gpCall":gp_call,
                     "outstandingLPCapital":lp_out,
                     "outstandingGPCapital":gp_out,
                     "unpaidPreferredReturn":carry})
    return rows

class IndependentFinancialRelease(unittest.TestCase):
    def close(self,actual,expected,label):
        self.assertTrue(math.isfinite(actual),f"{label}: nonfinite output")
        self.assertLessEqual(abs(actual-expected),max(.03,abs(expected)*1e-8),
            f"{label}: expected {expected:,.8f}, got {actual:,.8f}")

    def compare_case(self,shared,investment,waterfall=None):
        out=observed(shared,investment,waterfall)
        expected=independent_model(shared,investment)
        for field in ["principal","initialEquity","exitValue",
                      "exitDebtPayoff","netExitEquity","npv","equityMultiple"]:
            self.close(out[field],expected[field],field)
        self.assertEqual(len(out["rows"]),investment["holdYears"])
        for i,(got,want) in enumerate(zip(out["rows"],expected["rows"])):
            for field in ["noi","annualDebtService","endingDebt",
                          "exitValue","exitNetToEquity","netCash"]:
                self.close(got[field],want[field],f"year{i+1}.{field}")
        for i,(got,want) in enumerate(zip(out["cashflows"],expected["cashflows"])):
            self.close(got,want,f"cashflow[{i}]")
        if out["irr"]["status"]=="unique":
            irr=out["irr"]["ratePct"]/100
            self.close(sum(cf/(1+irr)**i for i,cf in enumerate(out["cashflows"])),0,"IRR discounted NPV")
        if waterfall:
            expected_rows=independent_waterfall(expected["cashflows"],waterfall)
            for i,(got,want) in enumerate(zip(out["waterfall"]["rows"],expected_rows)):
                for key in want:
                    if key=="year":self.assertEqual(got[key],want[key])
                    else:self.close(got[key],want[key],f"waterfall year{i+1}.{key}")

    def test_reference_debt_investment_waterfall(self):
        self.compare_case(DEFAULT,INV,WAT)

    def test_unlevered_zero_growth_and_sale_cost(self):
        self.compare_case(DEFAULT,{**INV,"debtMode":"none","purchasePrice":6500000,
                                   "acquisitionCosts":0,"holdYears":2,
                                   "noiGrowthPct":0,"exitCapRatePct":8,
                                   "saleCostPct":0},WAT)

    def test_hypothetical_principal_zero_rate(self):
        self.compare_case({**DEFAULT,"rate":0},{**INV,"debtMode":"custom",
                                                "customPrincipal":2000000,
                                                "holdYears":2,
                                                "noiGrowthPct":0},WAT)

    def test_sale_below_debt_returns_a_negative_final_cash_call(self):
        self.compare_case(DEFAULT,{**INV,"exitCapRatePct":100,
                                   "saleCostPct":10},WAT)

    def test_reference_irr_multiple_roots(self):
        script=r"""
const I=require('./tools/commercial-real-estate-loan-calculator/investment.js');
process.stdout.write(JSON.stringify({single:I.irr([-100,110]),
multi:I.irr([-100,230,-132]),undefined:I.irr([-100,-20,-10])}));
"""
        r=subprocess.run(["node","-e",script],cwd=ROOT,capture_output=True,
                         text=True,check=True)
        out=json.loads(r.stdout)
        self.close(out["single"]["ratePct"],10,"simple IRR")
        self.assertEqual(out["multi"]["status"],"multiple")
        for r in out["multi"]["rootsPct"]:
            self.close(-100+230/(1+r/100)-132/(1+r/100)**2,0,"IRR multiple root")
        self.assertEqual(len(out["multi"]["rootsPct"]),2)
        self.assertEqual(out["undefined"]["status"],"no-solution")

if __name__=="__main__":
    unittest.main(verbosity=2)
