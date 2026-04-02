
'use client'
import React, { useState } from "react";

function Card({ children }) {
  return (
    <div style={{
      background: "white",
      borderRadius: 14,
      padding: 16,
      boxShadow: "0 2px 10px rgba(0,0,0,0.08)"
    }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary" }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "none",
        cursor: "pointer",
        background: variant === "primary" ? "#0f766e" : "#e5e7eb",
        color: variant === "primary" ? "white" : "#111827",
        fontWeight: 600
      }}
    >
      {children}
    </button>
  );
}

function Txt({ placeholder, value, onChange, type = "text" }) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 10,
        border: "1px solid #d1d5db",
        boxSizing: "border-box"
      }}
    />
  );
}

export default function Home() {
  const [page, setPage] = useState("dashboard");

  const [investments, setInvestments] = useState([]);
  const [company, setCompany] = useState("");
  const [invoice, setInvoice] = useState("");
  const [amount, setAmount] = useState("");

  const [investors, setInvestors] = useState([]);
  const [investorName, setInvestorName] = useState("");
  const [investorAmount, setInvestorAmount] = useState("");
  const [investorCompany, setInvestorCompany] = useState("");

  const [totalProfit, setTotalProfit] = useState("");
  const [profitEntries, setProfitEntries] = useState([]);
  const [profitInvestor, setProfitInvestor] = useState("");
  const [profitAmount, setProfitAmount] = useState("");

  const [cheques, setCheques] = useState([]);
  const [chequeCompany, setChequeCompany] = useState("");
  const [chequeNumber, setChequeNumber] = useState("");
  const [chequeBank, setChequeBank] = useState("");
  const [chequeAmount, setChequeAmount] = useState("");
  const [chequeDate, setChequeDate] = useState("");
  const [depositDate, setDepositDate] = useState("");

  const [expenses, setExpenses] = useState([]);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");

  const [salesInvoices, setSalesInvoices] = useState([]);
  const [salesCompany, setSalesCompany] = useState("");
  const [salesNumber, setSalesNumber] = useState("");

  const [settledInvestors, setSettledInvestors] = useState([]);

  const addInvestment = () => {
    if (!company || !invoice || !amount) return;
    setInvestments([...investments, { company, invoice, amount: Number(amount) }]);
    setCompany(""); setInvoice(""); setAmount("");
    setPage("investments");
  };

  const addInvestor = () => {
    if (!investorName || !investorAmount || !investorCompany) return;
    setInvestors([...investors, {
      name: investorName,
      amount: Number(investorAmount),
      company: investorCompany
    }]);
    setInvestorName(""); setInvestorAmount(""); setInvestorCompany("");
    setPage("investors");
  };

  const addProfitEntry = () => {
    if (!profitInvestor || !profitAmount) return;
    setProfitEntries([...profitEntries, {
      investor: profitInvestor,
      amount: Number(profitAmount)
    }]);
    setProfitInvestor(""); setProfitAmount("");
  };

  const addCheque = () => {
    if (!chequeCompany || !chequeNumber || !chequeBank || !chequeAmount) return;
    setCheques([...cheques, {
      company: chequeCompany,
      number: chequeNumber,
      bank: chequeBank,
      amount: Number(chequeAmount),
      chequeDate,
      depositDate,
      status: "Pending"
    }]);
    setChequeCompany(""); setChequeNumber(""); setChequeBank(""); setChequeAmount(""); setChequeDate(""); setDepositDate("");
    setPage("cheques");
  };

  const markDeposited = (index) => {
    const updated = [...cheques];
    updated[index].status = "Deposited";
    setCheques(updated);
  };

  const addExpense = () => {
    if (!expenseTitle || !expenseAmount) return;
    setExpenses([...expenses, {
      title: expenseTitle,
      amount: Number(expenseAmount),
      date: expenseDate
    }]);
    setExpenseTitle(""); setExpenseAmount(""); setExpenseDate("");
  };

  const addSalesInvoice = () => {
    if (!salesCompany || !salesNumber) return;
    setSalesInvoices([...salesInvoices, { company: salesCompany, number: salesNumber }]);
    setSalesCompany(""); setSalesNumber("");
  };

  const settleInvestor = (index) => {
    const investor = investors[index];
    setSettledInvestors([...settledInvestors, investor]);
    setInvestors(investors.filter((_, i) => i !== index));
  };

  const totalInvestmentValue = investments.reduce((a, b) => a + b.amount, 0);
  const totalDistributed = profitEntries.reduce((a, b) => a + b.amount, 0);
  const myProfit = Number(totalProfit || 0) - totalDistributed;
  const pendingCheques = cheques.filter(c => c.status === "Pending");
  const notifications = pendingCheques.map(
    c => `Cheque ${c.number} for ${c.company} is pending deposit${c.depositDate ? ` on ${c.depositDate}` : ""}.`
  );

  const nav = [
    ["dashboard", "Dashboard"],
    ["investments", "Investments"],
    ["addInvestment", "Add Investment"],
    ["investors", "Investors"],
    ["addInvestor", "Add Investor"],
    ["profit", "Profit"],
    ["cheques", "Cheques"],
    ["addCheque", "Add Cheque"],
    ["expenses", "Expenses"],
    ["salesInvoices", "Sales Invoices"],
    ["settlement", "Settlement"],
    ["notifications", "Notifications"],
  ];

  return (
    <div style={{ minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <h1 style={{ fontSize: 32, marginBottom: 20 }}>Finance and Investment Tracker</h1>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 24 }}>
          {nav.map(([key, label]) => (
            <Btn key={key} onClick={() => setPage(key)} variant={page === key ? "primary" : "secondary"}>
              {label}
            </Btn>
          ))}
        </div>

        {page === "dashboard" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            <Card><div><strong>Total Investments</strong><div style={{ fontSize: 24, marginTop: 8 }}>LKR {totalInvestmentValue.toLocaleString()}</div></div></Card>
            <Card><div><strong>Active Investors</strong><div style={{ fontSize: 24, marginTop: 8 }}>{investors.length}</div></div></Card>
            <Card><div><strong>Total Profit</strong><div style={{ fontSize: 24, marginTop: 8 }}>LKR {Number(totalProfit || 0).toLocaleString()}</div></div></Card>
            <Card><div><strong>Pending Cheques</strong><div style={{ fontSize: 24, marginTop: 8 }}>{pendingCheques.length}</div></div></Card>
            <Card><div><strong>My Profit</strong><div style={{ fontSize: 24, marginTop: 8 }}>LKR {myProfit.toLocaleString()}</div></div></Card>
            <Card><div><strong>Expenses</strong><div style={{ fontSize: 24, marginTop: 8 }}>{expenses.length}</div></div></Card>
          </div>
        )}

        {page === "investments" && (
          <div style={{ display: "grid", gap: 12 }}>
            {investments.length === 0 ? <Card>No investments yet.</Card> : investments.map((inv, i) => (
              <Card key={i}>
                <div style={{ fontWeight: 700 }}>{inv.company}</div>
                <div>Invoice: {inv.invoice}</div>
                <div>Amount: LKR {inv.amount.toLocaleString()}</div>
              </Card>
            ))}
          </div>
        )}

        {page === "addInvestment" && (
          <Card>
            <div style={{ display: "grid", gap: 12 }}>
              <h2>Add Investment</h2>
              <Txt placeholder="Company Name" value={company} onChange={(e) => setCompany(e.target.value)} />
              <Txt placeholder="Invoice Number" value={invoice} onChange={(e) => setInvoice(e.target.value)} />
              <Txt placeholder="Amount (LKR)" value={amount} onChange={(e) => setAmount(e.target.value)} />
              <Btn onClick={addInvestment}>Save Investment</Btn>
            </div>
          </Card>
        )}

        {page === "investors" && (
          <div style={{ display: "grid", gap: 12 }}>
            {investors.length === 0 ? <Card>No investors yet.</Card> : investors.map((inv, i) => (
              <Card key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{inv.name}</div>
                    <div>Investment: {inv.company}</div>
                    <div>Amount: LKR {inv.amount.toLocaleString()}</div>
                  </div>
                  <Btn onClick={() => settleInvestor(i)}>Settle</Btn>
                </div>
              </Card>
            ))}
          </div>
        )}

        {page === "addInvestor" && (
          <Card>
            <div style={{ display: "grid", gap: 12 }}>
              <h2>Add Investor</h2>
              <Txt placeholder="Investor Name" value={investorName} onChange={(e) => setInvestorName(e.target.value)} />
              <Txt placeholder="Investment Company" value={investorCompany} onChange={(e) => setInvestorCompany(e.target.value)} />
              <Txt placeholder="Amount Invested (LKR)" value={investorAmount} onChange={(e) => setInvestorAmount(e.target.value)} />
              <Btn onClick={addInvestor}>Save Investor</Btn>
            </div>
          </Card>
        )}

        {page === "profit" && (
          <Card>
            <div style={{ display: "grid", gap: 12 }}>
              <h2>Profit Entry</h2>
              <Txt placeholder="Total Profit (LKR)" value={totalProfit} onChange={(e) => setTotalProfit(e.target.value)} />
              <Txt placeholder="Investor Name" value={profitInvestor} onChange={(e) => setProfitInvestor(e.target.value)} />
              <Txt placeholder="Profit Amount (LKR)" value={profitAmount} onChange={(e) => setProfitAmount(e.target.value)} />
              <Btn onClick={addProfitEntry}>Add Investor Profit</Btn>

              <div style={{ marginTop: 10 }}>
                {profitEntries.map((p, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                    <span>{p.investor}</span>
                    <span>LKR {p.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <div style={{ paddingTop: 10 }}>
                <div>Total Profit: LKR {Number(totalProfit || 0).toLocaleString()}</div>
                <div>Distributed: LKR {totalDistributed.toLocaleString()}</div>
                <div style={{ fontWeight: 700 }}>My Profit: LKR {myProfit.toLocaleString()}</div>
              </div>
            </div>
          </Card>
        )}

        {page === "cheques" && (
          <div style={{ display: "grid", gap: 12 }}>
            {cheques.length === 0 ? <Card>No cheques yet.</Card> : cheques.map((c, i) => (
              <Card key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{c.company} - {c.number}</div>
                    <div>Bank: {c.bank}</div>
                    <div>Amount: LKR {c.amount.toLocaleString()}</div>
                    <div>Cheque Date: {c.chequeDate || "-"}</div>
                    <div>Deposit Date: {c.depositDate || "-"}</div>
                    <div>Status: {c.status}</div>
                  </div>
                  {c.status === "Pending" && <Btn onClick={() => markDeposited(i)}>Mark Deposited</Btn>}
                </div>
              </Card>
            ))}
          </div>
        )}

        {page === "addCheque" && (
          <Card>
            <div style={{ display: "grid", gap: 12 }}>
              <h2>Add Cheque</h2>
              <Txt placeholder="Company" value={chequeCompany} onChange={(e) => setChequeCompany(e.target.value)} />
              <Txt placeholder="Cheque Number" value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} />
              <Txt placeholder="Bank" value={chequeBank} onChange={(e) => setChequeBank(e.target.value)} />
              <Txt placeholder="Amount (LKR)" value={chequeAmount} onChange={(e) => setChequeAmount(e.target.value)} />
              <Txt type="date" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} />
              <Txt type="date" value={depositDate} onChange={(e) => setDepositDate(e.target.value)} />
              <Btn onClick={addCheque}>Save Cheque</Btn>
            </div>
          </Card>
        )}

        {page === "expenses" && (
          <Card>
            <div style={{ display: "grid", gap: 12 }}>
              <h2>Expenses</h2>
              <Txt placeholder="Expense Title" value={expenseTitle} onChange={(e) => setExpenseTitle(e.target.value)} />
              <Txt placeholder="Amount (LKR)" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
              <Txt type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
              <Btn onClick={addExpense}>Add Expense</Btn>
              {expenses.map((e, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                  {e.title} - LKR {e.amount.toLocaleString()} {e.date ? `(${e.date})` : ""}
                </div>
              ))}
            </div>
          </Card>
        )}

        {page === "salesInvoices" && (
          <Card>
            <div style={{ display: "grid", gap: 12 }}>
              <h2>Sales Invoices</h2>
              <Txt placeholder="Company" value={salesCompany} onChange={(e) => setSalesCompany(e.target.value)} />
              <Txt placeholder="Invoice Number" value={salesNumber} onChange={(e) => setSalesNumber(e.target.value)} />
              <Btn onClick={addSalesInvoice}>Add Invoice</Btn>
              {salesInvoices.map((s, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                  {s.company} - {s.number}
                </div>
              ))}
            </div>
          </Card>
        )}

        {page === "settlement" && (
          <Card>
            <div style={{ display: "grid", gap: 12 }}>
              <h2>Settlement</h2>
              <div style={{ fontWeight: 700 }}>Settled Investors</div>
              {settledInvestors.length === 0 ? <div>No settled investors yet.</div> : settledInvestors.map((s, i) => (
                <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                  {s.name} - {s.company} - LKR {s.amount.toLocaleString()}
                </div>
              ))}
            </div>
          </Card>
        )}

        {page === "notifications" && (
          <Card>
            <div style={{ display: "grid", gap: 10 }}>
              <h2>Notifications</h2>
              {notifications.length === 0 ? <div>No alerts.</div> : notifications.map((n, i) => (
                <div key={i} style={{ padding: 10, borderRadius: 10, background: "#fef3c7" }}>{n}</div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
