'use client'
import React, { useMemo, useState } from "react";

function Card({ children }) {
  return (
    <div
      style={{
        background: "white",
        borderRadius: 14,
        padding: 16,
        boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
      }}
    >
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "10px 14px",
        borderRadius: 10,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        background: disabled
          ? "#9ca3af"
          : variant === "primary"
          ? "#0f766e"
          : "#e5e7eb",
        color: variant === "primary" ? "white" : "#111827",
        fontWeight: 600,
        opacity: disabled ? 0.7 : 1,
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
        boxSizing: "border-box",
      }}
    />
  );
}

function Select({ value, onChange, options, placeholder = "Select" }) {
  return (
    <select
      value={value}
      onChange={onChange}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 10,
        border: "1px solid #d1d5db",
        boxSizing: "border-box",
        background: "white",
      }}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function formatLKR(value) {
  return `LKR ${Number(value || 0).toLocaleString()}`;
}

export default function Home() {
  const [page, setPage] = useState("dashboard");
  const [selectedInvestmentId, setSelectedInvestmentId] = useState("");

  const [investments, setInvestments] = useState([]);
  const [investmentCompany, setInvestmentCompany] = useState("");
  const [investmentInvoice, setInvestmentInvoice] = useState("");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [myShare, setMyShare] = useState("");
  const [borrowedShare, setBorrowedShare] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [maturityDate, setMaturityDate] = useState("");

  const [investors, setInvestors] = useState([]);
  const [investorInvestmentId, setInvestorInvestmentId] = useState("");
  const [investorName, setInvestorName] = useState("");
  const [investorAmount, setInvestorAmount] = useState("");

  const [profits, setProfits] = useState([]);
  const [profitInvestmentId, setProfitInvestmentId] = useState("");
  const [totalProfit, setTotalProfit] = useState("");
  const [profitInvestor, setProfitInvestor] = useState("");
  const [profitAmount, setProfitAmount] = useState("");

  const [cheques, setCheques] = useState([]);
  const [chequeInvestmentId, setChequeInvestmentId] = useState("");
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

  const investmentOptions = investments.map((inv) => ({
    value: inv.id,
    label: `${inv.company} - ${inv.invoice}`,
  }));

  const selectedInvestment =
    investments.find((inv) => inv.id === selectedInvestmentId) || null;

  const selectedInvestors = investors.filter(
    (inv) => inv.investmentId === selectedInvestmentId && inv.status === "Active"
  );

  const selectedCheques = cheques.filter(
    (c) => c.investmentId === selectedInvestmentId
  );

  const selectedProfit = profits.find((p) => p.investmentId === selectedInvestmentId);

  const selectedProfitEntries = selectedProfit?.entries || [];
  const selectedDistributed = selectedProfitEntries.reduce(
    (sum, item) => sum + Number(item.amount || 0),
    0
  );
  const selectedMyProfit = Number(selectedProfit?.totalProfit || 0) - selectedDistributed;

  const totalInvestmentValue = useMemo(
    () => investments.reduce((sum, inv) => sum + Number(inv.amount || 0), 0),
    [investments]
  );

  const pendingCheques = cheques.filter((c) => c.status === "Pending");

  const notifications = [
    ...pendingCheques.map((c) => {
      const investment = investments.find((inv) => inv.id === c.investmentId);
      return `Cheque ${c.number} for ${investment?.company || "Investment"} is pending deposit${c.depositDate ? ` on ${c.depositDate}` : ""}.`;
    }),
    ...investments
      .filter((inv) => inv.maturityDate)
      .map(
        (inv) => `${inv.company} (${inv.invoice}) matures on ${inv.maturityDate}.`
      ),
  ];

  const addInvestment = () => {
    if (!investmentCompany || !investmentInvoice || !investmentAmount) return;
    const id = `${investmentCompany}-${investmentInvoice}-${Date.now()}`;
    const record = {
      id,
      company: investmentCompany,
      invoice: investmentInvoice,
      amount: Number(investmentAmount),
      myShare: Number(myShare || 0),
      borrowedShare: Number(borrowedShare || 0),
      durationDays: Number(durationDays || 0),
      maturityDate,
    };
    setInvestments((prev) => [...prev, record]);
    setSelectedInvestmentId(id);
    setInvestmentCompany("");
    setInvestmentInvoice("");
    setInvestmentAmount("");
    setMyShare("");
    setBorrowedShare("");
    setDurationDays("");
    setMaturityDate("");
    setPage("investmentDetails");
  };

  const addInvestor = () => {
    if (!investorInvestmentId || !investorName || !investorAmount) return;
    setInvestors((prev) => [
      ...prev,
      {
        id: `inv-${Date.now()}`,
        investmentId: investorInvestmentId,
        name: investorName,
        amount: Number(investorAmount),
        status: "Active",
      },
    ]);
    setSelectedInvestmentId(investorInvestmentId);
    setInvestorName("");
    setInvestorAmount("");
    setPage("investmentDetails");
  };

  const saveTotalProfit = () => {
    if (!profitInvestmentId || !totalProfit) return;
    setProfits((prev) => {
      const existing = prev.find((p) => p.investmentId === profitInvestmentId);
      if (existing) {
        return prev.map((p) =>
          p.investmentId === profitInvestmentId
            ? { ...p, totalProfit: Number(totalProfit) }
            : p
        );
      }
      return [
        ...prev,
        { investmentId: profitInvestmentId, totalProfit: Number(totalProfit), entries: [] },
      ];
    });
    setSelectedInvestmentId(profitInvestmentId);
  };

  const addProfitEntry = () => {
    if (!profitInvestmentId || !profitInvestor || !profitAmount) return;
    setProfits((prev) => {
      const existing = prev.find((p) => p.investmentId === profitInvestmentId);
      if (existing) {
        return prev.map((p) =>
          p.investmentId === profitInvestmentId
            ? {
                ...p,
                entries: [
                  ...p.entries,
                  { investor: profitInvestor, amount: Number(profitAmount), paid: false },
                ],
              }
            : p
        );
      }
      return [
        ...prev,
        {
          investmentId: profitInvestmentId,
          totalProfit: 0,
          entries: [{ investor: profitInvestor, amount: Number(profitAmount), paid: false }],
        },
      ];
    });
    setSelectedInvestmentId(profitInvestmentId);
    setProfitInvestor("");
    setProfitAmount("");
    setPage("investmentDetails");
  };

  const addCheque = () => {
    if (!chequeInvestmentId || !chequeNumber || !chequeBank || !chequeAmount) return;
    setCheques((prev) => [
      ...prev,
      {
        id: `chq-${Date.now()}`,
        investmentId: chequeInvestmentId,
        number: chequeNumber,
        bank: chequeBank,
        amount: Number(chequeAmount),
        chequeDate,
        depositDate,
        status: "Pending",
      },
    ]);
    setSelectedInvestmentId(chequeInvestmentId);
    setChequeNumber("");
    setChequeBank("");
    setChequeAmount("");
    setChequeDate("");
    setDepositDate("");
    setPage("investmentDetails");
  };

  const markDeposited = (chequeId) => {
    setCheques((prev) =>
      prev.map((c) => (c.id === chequeId ? { ...c, status: "Deposited" } : c))
    );
  };

  const addExpense = () => {
    if (!expenseTitle || !expenseAmount) return;
    setExpenses((prev) => [
      ...prev,
      { id: `exp-${Date.now()}`, title: expenseTitle, amount: Number(expenseAmount), date: expenseDate },
    ]);
    setExpenseTitle("");
    setExpenseAmount("");
    setExpenseDate("");
  };

  const addSalesInvoice = () => {
    if (!salesCompany || !salesNumber) return;
    setSalesInvoices((prev) => [
      ...prev,
      { id: `sale-${Date.now()}`, company: salesCompany, number: salesNumber },
    ]);
    setSalesCompany("");
    setSalesNumber("");
  };

  const settleInvestor = (investorId) => {
    setInvestors((prev) =>
      prev.map((inv) => (inv.id === investorId ? { ...inv, status: "Settled" } : inv))
    );
  };

  const openInvestment = (investmentId) => {
    setSelectedInvestmentId(investmentId);
    setProfitInvestmentId(investmentId);
    setInvestorInvestmentId(investmentId);
    setChequeInvestmentId(investmentId);
    const currentProfit = profits.find((p) => p.investmentId === investmentId);
    setTotalProfit(currentProfit?.totalProfit ? String(currentProfit.totalProfit) : "");
    setPage("investmentDetails");
  };

  const nav = [
    ["dashboard", "Dashboard"],
    ["investments", "Investments"],
    ["addInvestment", "Add Investment"],
    ["investmentDetails", "Investment Details"],
    ["addInvestor", "Add Investor"],
    ["profit", "Profit"],
    ["addCheque", "Add Cheque"],
    ["expenses", "Expenses"],
    ["salesInvoices", "Sales Invoices"],
    ["settlement", "Settlement"],
    ["notifications", "Notifications"],
  ];

  return (
    <div style={{ minHeight: "100vh", padding: 24, background: "#f3f4f6", fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 1250, margin: "0 auto" }}>
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
            <Card><div><strong>Total Investments</strong><div style={{ fontSize: 24, marginTop: 8 }}>{formatLKR(totalInvestmentValue)}</div></div></Card>
            <Card><div><strong>Active Investments</strong><div style={{ fontSize: 24, marginTop: 8 }}>{investments.length}</div></div></Card>
            <Card><div><strong>Active Investors</strong><div style={{ fontSize: 24, marginTop: 8 }}>{investors.filter(i => i.status === "Active").length}</div></div></Card>
            <Card><div><strong>Pending Cheques</strong><div style={{ fontSize: 24, marginTop: 8 }}>{pendingCheques.length}</div></div></Card>
            <Card><div><strong>Expenses</strong><div style={{ fontSize: 24, marginTop: 8 }}>{formatLKR(expenses.reduce((s, e) => s + e.amount, 0))}</div></div></Card>
            <Card><div><strong>Sales Invoices</strong><div style={{ fontSize: 24, marginTop: 8 }}>{salesInvoices.length}</div></div></Card>
          </div>
        )}

        {page === "investments" && (
          <div style={{ display: "grid", gap: 12 }}>
            {investments.length === 0 ? (
              <Card>No investments yet.</Card>
            ) : (
              investments.map((inv) => {
                const invInvestors = investors.filter((i) => i.investmentId === inv.id && i.status === "Active");
                const invProfit = profits.find((p) => p.investmentId === inv.id);
                const invCheques = cheques.filter((c) => c.investmentId === inv.id);
                return (
                  <Card key={inv.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>{inv.company}</div>
                        <div>Invoice: {inv.invoice}</div>
                        <div>Total Investment: {formatLKR(inv.amount)}</div>
                        <div>My Share: {formatLKR(inv.myShare)}</div>
                        <div>Borrowed: {formatLKR(inv.borrowedShare)}</div>
                        <div>Investors: {invInvestors.length}</div>
                        <div>Total Profit: {formatLKR(invProfit?.totalProfit || 0)}</div>
                        <div>Cheques: {invCheques.length}</div>
                      </div>
                      <Btn onClick={() => openInvestment(inv.id)}>Open</Btn>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        )}

        {page === "addInvestment" && (
          <Card>
            <div style={{ display: "grid", gap: 12 }}>
              <h2>Add Investment</h2>
              <Txt placeholder="Company Name" value={investmentCompany} onChange={(e) => setInvestmentCompany(e.target.value)} />
              <Txt placeholder="Invoice Number" value={investmentInvoice} onChange={(e) => setInvestmentInvoice(e.target.value)} />
              <Txt placeholder="Total Amount (LKR)" value={investmentAmount} onChange={(e) => setInvestmentAmount(e.target.value)} />
              <Txt placeholder="My Share (LKR)" value={myShare} onChange={(e) => setMyShare(e.target.value)} />
              <Txt placeholder="Borrowed Amount (LKR)" value={borrowedShare} onChange={(e) => setBorrowedShare(e.target.value)} />
              <Txt placeholder="Duration in Days" value={durationDays} onChange={(e) => setDurationDays(e.target.value)} />
              <Txt type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} />
              <Btn onClick={addInvestment}>Save Investment</Btn>
            </div>
          </Card>
        )}

        {page === "investmentDetails" && (
          <div style={{ display: "grid", gap: 16 }}>
            {!selectedInvestment ? (
              <Card>Select an investment from the Investments page.</Card>
            ) : (
              <>
                <Card>
                  <div style={{ display: "grid", gap: 8 }}>
                    <h2>{selectedInvestment.company} - {selectedInvestment.invoice}</h2>
                    <div>Total Investment: {formatLKR(selectedInvestment.amount)}</div>
                    <div>My Share: {formatLKR(selectedInvestment.myShare)}</div>
                    <div>Borrowed: {formatLKR(selectedInvestment.borrowedShare)}</div>
                    <div>Duration: {selectedInvestment.durationDays || 0} days</div>
                    <div>Maturity Date: {selectedInvestment.maturityDate || "-"}</div>
                  </div>
                </Card>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 16 }}>
                  <Card>
                    <h3>Borrowed Investors</h3>
                    {selectedInvestors.length === 0 ? (
                      <div>No active investors linked.</div>
                    ) : (
                      selectedInvestors.map((inv) => (
                        <div key={inv.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                          {inv.name} - {formatLKR(inv.amount)}
                        </div>
                      ))
                    )}
                  </Card>

                  <Card>
                    <h3>Profit Summary</h3>
                    <div>Total Profit: {formatLKR(selectedProfit?.totalProfit || 0)}</div>
                    <div>Distributed to Investors: {formatLKR(selectedDistributed)}</div>
                    <div style={{ fontWeight: 700 }}>My Profit: {formatLKR(selectedMyProfit)}</div>
                    <div style={{ marginTop: 10 }}>
                      {selectedProfitEntries.map((entry, i) => (
                        <div key={i} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                          {entry.investor} - {formatLKR(entry.amount)}
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card>
                    <h3>Cheques</h3>
                    {selectedCheques.length === 0 ? (
                      <div>No cheques linked.</div>
                    ) : (
                      selectedCheques.map((c) => (
                        <div key={c.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                          <div>{c.number} - {c.bank}</div>
                          <div>{formatLKR(c.amount)}</div>
                          <div>Status: {c.status}</div>
                          {c.status === "Pending" && (
                            <div style={{ marginTop: 6 }}>
                              <Btn onClick={() => markDeposited(c.id)}>Mark Deposited</Btn>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </Card>
                </div>
              </>
            )}
          </div>
        )}

        {page === "addInvestor" && (
          <Card>
            <div style={{ display: "grid", gap: 12 }}>
              <h2>Add Investor</h2>
              <Select
                value={investorInvestmentId}
                onChange={(e) => setInvestorInvestmentId(e.target.value)}
                options={investmentOptions}
                placeholder="Select Investment"
              />
              <Txt placeholder="Investor Name" value={investorName} onChange={(e) => setInvestorName(e.target.value)} />
              <Txt placeholder="Amount Invested (LKR)" value={investorAmount} onChange={(e) => setInvestorAmount(e.target.value)} />
              <Btn onClick={addInvestor} disabled={!investorInvestmentId}>Save Investor</Btn>
            </div>
          </Card>
        )}

        {page === "profit" && (
          <Card>
            <div style={{ display: "grid", gap: 12 }}>
              <h2>Profit Entry</h2>
              <Select
                value={profitInvestmentId}
                onChange={(e) => setProfitInvestmentId(e.target.value)}
                options={investmentOptions}
                placeholder="Select Investment"
              />
              <Txt placeholder="Total Profit (LKR)" value={totalProfit} onChange={(e) => setTotalProfit(e.target.value)} />
              <Btn onClick={saveTotalProfit} disabled={!profitInvestmentId}>Save Total Profit</Btn>
              <Txt placeholder="Investor Name" value={profitInvestor} onChange={(e) => setProfitInvestor(e.target.value)} />
              <Txt placeholder="Investor Profit Amount (LKR)" value={profitAmount} onChange={(e) => setProfitAmount(e.target.value)} />
              <Btn onClick={addProfitEntry} disabled={!profitInvestmentId}>Add Investor Profit</Btn>
            </div>
          </Card>
        )}

        {page === "addCheque" && (
          <Card>
            <div style={{ display: "grid", gap: 12 }}>
              <h2>Add Cheque</h2>
              <Select
                value={chequeInvestmentId}
                onChange={(e) => setChequeInvestmentId(e.target.value)}
                options={investmentOptions}
                placeholder="Select Investment"
              />
              <Txt placeholder="Cheque Number" value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} />
              <Txt placeholder="Bank" value={chequeBank} onChange={(e) => setChequeBank(e.target.value)} />
              <Txt placeholder="Amount (LKR)" value={chequeAmount} onChange={(e) => setChequeAmount(e.target.value)} />
              <Txt type="date" value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} />
              <Txt type="date" value={depositDate} onChange={(e) => setDepositDate(e.target.value)} />
              <Btn onClick={addCheque} disabled={!chequeInvestmentId}>Save Cheque</Btn>
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
              {expenses.map((e) => (
                <div key={e.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
                  {e.title} - {formatLKR(e.amount)} {e.date ? `(${e.date})` : ""}
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
              {salesInvoices.map((s) => (
                <div key={s.id} style={{ padding: "8px 0", borderBottom: "1px solid #eee" }}>
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
              {selectedInvestment ? (
                <>
                  <div style={{ fontWeight: 700 }}>
                    {selectedInvestment.company} - {selectedInvestment.invoice}
                  </div>
                  {investors.filter((i) => i.investmentId === selectedInvestment.id).length === 0 ? (
                    <div>No investors for this investment.</div>
                  ) : (
                    investors
                      .filter((i) => i.investmentId === selectedInvestment.id)
                      .map((inv) => (
                        <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
                          <span>
                            {inv.name} - {formatLKR(inv.amount)} - {inv.status}
                          </span>
                          {inv.status === "Active" && (
                            <Btn onClick={() => settleInvestor(inv.id)}>Settle</Btn>
                          )}
                        </div>
                      ))
                  )}
                </>
              ) : (
                <div>Open an investment first from the Investments page, then come here.</div>
              )}
            </div>
          </Card>
        )}

        {page === "notifications" && (
          <Card>
            <div style={{ display: "grid", gap: 10 }}>
              <h2>Notifications</h2>
              {notifications.length === 0 ? (
                <div>No alerts.</div>
              ) : (
                notifications.map((n, i) => (
                  <div key={i} style={{ padding: 10, borderRadius: 10, background: "#fef3c7" }}>
                    {n}
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
