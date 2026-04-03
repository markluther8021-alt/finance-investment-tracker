"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "finance_tracker_v2";
const SELECTED_KEY = "finance_tracker_selected_investment";

const emptyInvestmentForm = () => ({
  company: "",
  invoice: "",
  amount: "",
  myShare: "",
  borrowedShare: "",
  durationDays: "",
  maturityDate: "",
  status: "Active",
  notes: "",
  fundingType: "BORROWED",
  linkedInvestors: [
    {
      rowId: createId(),
      mode: "existing",
      investorId: "",
      name: "",
      phone: "",
      email: "",
      contribution: "",
      sharePercent: "",
      note: "",
    },
  ],
});

const emptyProfitForm = () => ({
  date: today(),
  generatedAmount: "",
  payableAmount: "",
  note: "",
});

const emptyPaymentForm = () => ({
  paymentDate: today(),
  chequeNumber: "",
  bank: "",
  amount: "",
  status: "cleared",
  note: "",
});

function createId() {
  return Math.random().toString(36).slice(2, 10);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function currency(value) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 2,
  }).format(toNumber(value));
}

function shortDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString();
}

function getInvestmentMetrics(investment) {
  const profits = investment?.profits ?? [];
  const payments = investment?.payments ?? [];
  const linkedInvestors = investment?.linkedInvestors ?? [];

  const totalProfitGenerated = profits.reduce(
    (sum, item) => sum + toNumber(item.generatedAmount),
    0
  );

  const totalProfitPayable = profits.reduce(
    (sum, item) => sum + toNumber(item.payableAmount),
    0
  );

  const totalPaid = payments
    .filter((item) => item.status === "cleared")
    .reduce((sum, item) => sum + toNumber(item.amount), 0);

  const outstanding = Math.max(0, totalProfitPayable - totalPaid);

  const settlementStatus =
    totalProfitPayable === 0
      ? "No Profit Due"
      : totalPaid === 0
      ? "Unsettled"
      : totalPaid < totalProfitPayable
      ? "Partially Settled"
      : "Settled";

  const totalBorrowed = linkedInvestors.reduce(
    (sum, item) => sum + toNumber(item.contribution),
    0
  );

  return {
    totalProfitGenerated,
    totalProfitPayable,
    totalPaid,
    outstanding,
    settlementStatus,
    totalBorrowed,
  };
}

export default function Page() {
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("dashboard");
  const [investments, setInvestments] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState("");
  const [investmentForm, setInvestmentForm] = useState(emptyInvestmentForm());
  const [profitForm, setProfitForm] = useState(emptyProfitForm());
  const [paymentForm, setPaymentForm] = useState(emptyPaymentForm());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setInvestments(parsed.investments ?? []);
        setInvestors(parsed.investors ?? []);
      }
      const savedSelected = localStorage.getItem(SELECTED_KEY);
      if (savedSelected) {
        setSelectedInvestmentId(savedSelected);
      }
    } catch (error) {
      console.error("Failed to load saved data", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        investments,
        investors,
      })
    );
  }, [loaded, investments, investors]);

  useEffect(() => {
    if (!loaded) return;

    if (selectedInvestmentId) {
      localStorage.setItem(SELECTED_KEY, selectedInvestmentId);
      const stillExists = investments.some((item) => item.id === selectedInvestmentId);
      if (stillExists) return;
    }

    if (investments.length === 0) {
      setSelectedInvestmentId("");
      return;
    }

    const savedId = localStorage.getItem(SELECTED_KEY);
    const saved = investments.find((item) => item.id === savedId);
    const active = investments.find((item) => item.status === "Active");
    const newest = [...investments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    const next = saved || active || newest || investments[0];
    if (next) {
      setSelectedInvestmentId(next.id);
    }
  }, [loaded, investments, selectedInvestmentId]);

  const selectedInvestment = useMemo(
    () => investments.find((item) => item.id === selectedInvestmentId) || null,
    [investments, selectedInvestmentId]
  );

  const selectedMetrics = useMemo(
    () => getInvestmentMetrics(selectedInvestment),
    [selectedInvestment]
  );

  const dashboardTotals = useMemo(() => {
    return investments.reduce(
      (acc, investment) => {
        const metrics = getInvestmentMetrics(investment);
        acc.totalInvested += toNumber(investment.amount);
        acc.totalProfitPayable += metrics.totalProfitPayable;
        acc.totalPaid += metrics.totalPaid;
        acc.outstanding += metrics.outstanding;
        return acc;
      },
      {
        totalInvested: 0,
        totalProfitPayable: 0,
        totalPaid: 0,
        outstanding: 0,
      }
    );
  }, [investments]);

  function updateInvestmentForm(field, value) {
    setInvestmentForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateInvestorRow(rowId, field, value) {
    setInvestmentForm((prev) => ({
      ...prev,
      linkedInvestors: prev.linkedInvestors.map((row) =>
        row.rowId === rowId ? { ...row, [field]: value } : row
      ),
    }));
  }

  function addInvestorRow() {
    setInvestmentForm((prev) => ({
      ...prev,
      linkedInvestors: [
        ...prev.linkedInvestors,
        {
          rowId: createId(),
          mode: "existing",
          investorId: "",
          name: "",
          phone: "",
          email: "",
          contribution: "",
          sharePercent: "",
          note: "",
        },
      ],
    }));
  }

  function removeInvestorRow(rowId) {
    setInvestmentForm((prev) => ({
      ...prev,
      linkedInvestors:
        prev.linkedInvestors.length === 1
          ? prev.linkedInvestors
          : prev.linkedInvestors.filter((row) => row.rowId !== rowId),
    }));
  }

  function resetAllForms() {
    setInvestmentForm(emptyInvestmentForm());
    setProfitForm(emptyProfitForm());
    setPaymentForm(emptyPaymentForm());
  }

  function handleCreateInvestment(e) {
    e.preventDefault();

    if (!investmentForm.company.trim()) {
      alert("Enter an investment/company name.");
      return;
    }

    if (!investmentForm.amount) {
      alert("Enter the investment amount.");
      return;
    }

    let updatedInvestors = [...investors];
    let linkedInvestors = [];

    if (investmentForm.fundingType === "BORROWED") {
      const validRows = investmentForm.linkedInvestors.filter((row) => {
        if (row.mode === "existing") {
          return row.investorId && row.contribution;
        }
        return row.name.trim() && row.contribution;
      });

      linkedInvestors = validRows.map((row) => {
        if (row.mode === "existing") {
          const matched = updatedInvestors.find((item) => item.id === row.investorId);
          return {
            id: createId(),
            investorId: matched?.id || "",
            investorName: matched?.name || "",
            phone: matched?.phone || "",
            email: matched?.email || "",
            contribution: toNumber(row.contribution),
            sharePercent: toNumber(row.sharePercent),
            note: row.note || "",
          };
        }

        const newInvestor = {
          id: createId(),
          name: row.name.trim(),
          phone: row.phone.trim(),
          email: row.email.trim(),
          createdAt: new Date().toISOString(),
        };

        updatedInvestors.push(newInvestor);

        return {
          id: createId(),
          investorId: newInvestor.id,
          investorName: newInvestor.name,
          phone: newInvestor.phone,
          email: newInvestor.email,
          contribution: toNumber(row.contribution),
          sharePercent: toNumber(row.sharePercent),
          note: row.note || "",
        };
      });
    }

    const newInvestment = {
      id: createId(),
      company: investmentForm.company.trim(),
      invoice: investmentForm.invoice.trim(),
      amount: toNumber(investmentForm.amount),
      myShare: toNumber(investmentForm.myShare),
      borrowedShare: toNumber(investmentForm.borrowedShare),
      durationDays: toNumber(investmentForm.durationDays),
      maturityDate: investmentForm.maturityDate || "",
      status: investmentForm.status,
      notes: investmentForm.notes.trim(),
      fundingType: investmentForm.fundingType,
      linkedInvestors,
      profits: [],
      payments: [],
      createdAt: new Date().toISOString(),
    };

    setInvestors(updatedInvestors);
    setInvestments((prev) => [newInvestment, ...prev]);
    setSelectedInvestmentId(newInvestment.id);
    resetAllForms();
    setTab("investment");
  }

  function addProfit(e) {
    e.preventDefault();
    if (!selectedInvestment) return alert("Select an investment first.");
    if (!profitForm.generatedAmount && !profitForm.payableAmount) {
      return alert("Enter profit values.");
    }

    const newProfit = {
      id: createId(),
      date: profitForm.date,
      generatedAmount: toNumber(profitForm.generatedAmount),
      payableAmount: toNumber(profitForm.payableAmount),
      note: profitForm.note.trim(),
      createdAt: new Date().toISOString(),
    };

    setInvestments((prev) =>
      prev.map((investment) =>
        investment.id === selectedInvestment.id
          ? { ...investment, profits: [newProfit, ...(investment.profits || [])] }
          : investment
      )
    );

    setProfitForm(emptyProfitForm());
  }

  function addPayment(e) {
    e.preventDefault();
    if (!selectedInvestment) return alert("Select an investment first.");
    if (!paymentForm.amount) return alert("Enter payment amount.");

    const newPayment = {
      id: createId(),
      paymentDate: paymentForm.paymentDate,
      chequeNumber: paymentForm.chequeNumber.trim(),
      bank: paymentForm.bank.trim(),
      amount: toNumber(paymentForm.amount),
      status: paymentForm.status,
      note: paymentForm.note.trim(),
      createdAt: new Date().toISOString(),
    };

    setInvestments((prev) =>
      prev.map((investment) =>
        investment.id === selectedInvestment.id
          ? { ...investment, payments: [newPayment, ...(investment.payments || [])] }
          : investment
      )
    );

    setPaymentForm(emptyPaymentForm());
  }

  function seedDemoData() {
    const investorA = {
      id: createId(),
      name: "Investor A",
      phone: "0771234567",
      email: "investor.a@example.com",
      createdAt: new Date().toISOString(),
    };

    const investorB = {
      id: createId(),
      name: "Investor B",
      phone: "0777654321",
      email: "investor.b@example.com",
      createdAt: new Date().toISOString(),
    };

    const sampleInvestment = {
      id: createId(),
      company: "Blue Ocean Holdings",
      invoice: "INV-1001",
      amount: 300000,
      myShare: 100000,
      borrowedShare: 200000,
      durationDays: 90,
      maturityDate: today(),
      status: "Active",
      notes: "Demo investment for testing the workflow.",
      fundingType: "BORROWED",
      linkedInvestors: [
        {
          id: createId(),
          investorId: investorA.id,
          investorName: investorA.name,
          phone: investorA.phone,
          email: investorA.email,
          contribution: 125000,
          sharePercent: 62.5,
          note: "Primary investor",
        },
        {
          id: createId(),
          investorId: investorB.id,
          investorName: investorB.name,
          phone: investorB.phone,
          email: investorB.email,
          contribution: 75000,
          sharePercent: 37.5,
          note: "Second investor",
        },
      ],
      profits: [
        {
          id: createId(),
          date: today(),
          generatedAmount: 50000,
          payableAmount: 30000,
          note: "First cycle profit",
          createdAt: new Date().toISOString(),
        },
      ],
      payments: [
        {
          id: createId(),
          paymentDate: today(),
          chequeNumber: "CHQ-001",
          bank: "Commercial Bank",
          amount: 10000,
          status: "cleared",
          note: "Part settlement",
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
    };

    setInvestors([investorA, investorB]);
    setInvestments([sampleInvestment]);
    setSelectedInvestmentId(sampleInvestment.id);
    setTab("investment");
  }

  if (!loaded) {
    return (
      <main className="min-h-screen bg-slate-100 p-6">
        <div className="mx-auto max-w-7xl rounded-3xl bg-white p-8 shadow">
          Loading...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-3xl bg-gradient-to-r from-slate-900 to-slate-700 p-6 text-white shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
                Finance Investment Tracker
              </p>
              <h1 className="mt-2 text-3xl font-bold">Investment dashboard</h1>
              <p className="mt-2 text-sm text-slate-200">
                Create investments, attach borrowed investors in the same form,
                track payable profit, and monitor settlement automatically.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTab("dashboard")}
                className={buttonClass(tab === "dashboard")}
              >
                Dashboard
              </button>
              <button
                onClick={() => setTab("new")}
                className={buttonClass(tab === "new")}
              >
                Add Investment
              </button>
              <button
                onClick={() => setTab("investment")}
                className={buttonClass(tab === "investment")}
              >
                Investment Details
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <SummaryCard label="Total Investments" value={investments.length} />
          <SummaryCard
            label="Total Invested"
            value={currency(dashboardTotals.totalInvested)}
          />
          <SummaryCard
            label="Total Profit Payable"
            value={currency(dashboardTotals.totalProfitPayable)}
          />
          <SummaryCard
            label="Outstanding"
            value={currency(dashboardTotals.outstanding)}
          />
        </section>

        {investments.length === 0 ? (
          <section className="rounded-3xl bg-white p-8 shadow">
            <h2 className="text-xl font-semibold text-slate-900">
              No investments yet
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Start by adding a new investment, or load demo data to test the
              full flow instantly.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                onClick={() => setTab("new")}
                className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
              >
                Add first investment
              </button>
              <button
                onClick={seedDemoData}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Load demo data
              </button>
            </div>
          </section>
        ) : null}

        {investments.length > 0 ? (
          <section className="grid gap-6 lg:grid-cols-[320px,1fr]">
            <aside className="rounded-3xl bg-white p-5 shadow">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Investments
                </h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  {investments.length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {investments.map((investment) => {
                  const metrics = getInvestmentMetrics(investment);
                  const active = investment.id === selectedInvestmentId;

                  return (
                    <button
                      key={investment.id}
                      onClick={() => {
                        setSelectedInvestmentId(investment.id);
                        setTab("investment");
                      }}
                      className={`w-full rounded-2xl border p-4 text-left transition ${
                        active
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold">
                            {investment.company}
                          </p>
                          <p
                            className={`mt-1 text-xs ${
                              active ? "text-slate-300" : "text-slate-500"
                            }`}
                          >
                            {investment.invoice || "No invoice"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                            active
                              ? "bg-white/15 text-white"
                              : "bg-slate-200 text-slate-700"
                          }`}
                        >
                          {investment.status}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                        <MiniMetric
                          label="Amount"
                          value={currency(investment.amount)}
                          active={active}
                        />
                        <MiniMetric
                          label="Outstanding"
                          value={currency(metrics.outstanding)}
                          active={active}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <div className="space-y-6">
              {tab === "dashboard" ? (
                <DashboardView
                  investments={investments}
                  onOpenInvestment={(id) => {
                    setSelectedInvestmentId(id);
                    setTab("investment");
                  }}
                />
              ) : null}

              {tab === "new" ? (
                <section className="rounded-3xl bg-white p-6 shadow">
                  <div className="mb-6">
                    <h2 className="text-2xl font-semibold text-slate-900">
                      Add new investment
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Add the investment and borrowed investor details in the
                      same workflow.
                    </p>
                  </div>

                  <form onSubmit={handleCreateInvestment} className="space-y-8">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Input
                        label="Investment / Company"
                        value={investmentForm.company}
                        onChange={(value) => updateInvestmentForm("company", value)}
                        placeholder="Blue Ocean Holdings"
                      />
                      <Input
                        label="Invoice No"
                        value={investmentForm.invoice}
                        onChange={(value) => updateInvestmentForm("invoice", value)}
                        placeholder="INV-1001"
                      />
                      <Input
                        label="Total Investment Amount"
                        type="number"
                        value={investmentForm.amount}
                        onChange={(value) => updateInvestmentForm("amount", value)}
                        placeholder="300000"
                      />
                      <Input
                        label="My Share"
                        type="number"
                        value={investmentForm.myShare}
                        onChange={(value) => updateInvestmentForm("myShare", value)}
                        placeholder="100000"
                      />
                      <Input
                        label="Borrowed Share"
                        type="number"
                        value={investmentForm.borrowedShare}
                        onChange={(value) =>
                          updateInvestmentForm("borrowedShare", value)
                        }
                        placeholder="200000"
                      />
                      <Input
                        label="Duration (days)"
                        type="number"
                        value={investmentForm.durationDays}
                        onChange={(value) =>
                          updateInvestmentForm("durationDays", value)
                        }
                        placeholder="90"
                      />
                      <Input
                        label="Maturity Date"
                        type="date"
                        value={investmentForm.maturityDate}
                        onChange={(value) =>
                          updateInvestmentForm("maturityDate", value)
                        }
                      />
                      <Select
                        label="Status"
                        value={investmentForm.status}
                        onChange={(value) => updateInvestmentForm("status", value)}
                        options={["Active", "Closed", "Pending"]}
                      />
                    </div>

                    <div className="rounded-3xl border border-slate-200 p-5">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Funding details
                        </h3>
                        <p className="text-sm text-slate-600">
                          Put borrowed investor details directly here.
                        </p>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Select
                          label="Funding Type"
                          value={investmentForm.fundingType}
                          onChange={(value) =>
                            updateInvestmentForm("fundingType", value)
                          }
                          options={["BORROWED", "SELF"]}
                          labels={{
                            BORROWED: "Borrowed / Investor Funded",
                            SELF: "Self Funded",
                          }}
                        />
                        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                          {investmentForm.fundingType === "SELF"
                            ? "This investment will be saved without external investors."
                            : "You can select existing investors or add new investors inline."}
                        </div>
                      </div>

                      {investmentForm.fundingType === "BORROWED" ? (
                        <div className="mt-5 space-y-4">
                          {investmentForm.linkedInvestors.map((row, index) => (
                            <div
                              key={row.rowId}
                              className="rounded-3xl border border-slate-200 p-4"
                            >
                              <div className="mb-4 flex items-center justify-between">
                                <h4 className="font-semibold text-slate-900">
                                  Investor #{index + 1}
                                </h4>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateInvestorRow(
                                        row.rowId,
                                        "mode",
                                        row.mode === "existing" ? "new" : "existing"
                                      )
                                    }
                                    className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
                                  >
                                    {row.mode === "existing"
                                      ? "Add new investor"
                                      : "Use existing investor"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => removeInvestorRow(row.rowId)}
                                    className="rounded-xl border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>

                              {row.mode === "existing" ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                  <Select
                                    label="Select Investor"
                                    value={row.investorId}
                                    onChange={(value) =>
                                      updateInvestorRow(row.rowId, "investorId", value)
                                    }
                                    options={investors.map((item) => item.id)}
                                    labels={Object.fromEntries(
                                      investors.map((item) => [item.id, item.name])
                                    )}
                                    placeholder={
                                      investors.length
                                        ? "Choose investor"
                                        : "No saved investors yet"
                                    }
                                  />
                                  <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                                    {row.investorId
                                      ? (() => {
                                          const current = investors.find(
                                            (item) => item.id === row.investorId
                                          );
                                          return current
                                            ? `${current.name}${current.phone ? ` • ${current.phone}` : ""}${current.email ? ` • ${current.email}` : ""}`
                                            : "Investor not found";
                                        })()
                                      : "Choose an existing investor or switch to add a new one."}
                                  </div>
                                  <Input
                                    label="Contribution"
                                    type="number"
                                    value={row.contribution}
                                    onChange={(value) =>
                                      updateInvestorRow(
                                        row.rowId,
                                        "contribution",
                                        value
                                      )
                                    }
                                    placeholder="100000"
                                  />
                                  <Input
                                    label="Share %"
                                    type="number"
                                    value={row.sharePercent}
                                    onChange={(value) =>
                                      updateInvestorRow(
                                        row.rowId,
                                        "sharePercent",
                                        value
                                      )
                                    }
                                    placeholder="50"
                                  />
                                  <div className="md:col-span-2">
                                    <Input
                                      label="Note"
                                      value={row.note}
                                      onChange={(value) =>
                                        updateInvestorRow(row.rowId, "note", value)
                                      }
                                      placeholder="Short-term funding"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="grid gap-4 md:grid-cols-2">
                                  <Input
                                    label="Investor Name"
                                    value={row.name}
                                    onChange={(value) =>
                                      updateInvestorRow(row.rowId, "name", value)
                                    }
                                    placeholder="John Silva"
                                  />
                                  <Input
                                    label="Phone"
                                    value={row.phone}
                                    onChange={(value) =>
                                      updateInvestorRow(row.rowId, "phone", value)
                                    }
                                    placeholder="0771234567"
                                  />
                                  <Input
                                    label="Email"
                                    value={row.email}
                                    onChange={(value) =>
                                      updateInvestorRow(row.rowId, "email", value)
                                    }
                                    placeholder="john@example.com"
                                  />
                                  <Input
                                    label="Contribution"
                                    type="number"
                                    value={row.contribution}
                                    onChange={(value) =>
                                      updateInvestorRow(
                                        row.rowId,
                                        "contribution",
                                        value
                                      )
                                    }
                                    placeholder="100000"
                                  />
                                  <Input
                                    label="Share %"
                                    type="number"
                                    value={row.sharePercent}
                                    onChange={(value) =>
                                      updateInvestorRow(
                                        row.rowId,
                                        "sharePercent",
                                        value
                                      )
                                    }
                                    placeholder="50"
                                  />
                                  <Input
                                    label="Note"
                                    value={row.note}
                                    onChange={(value) =>
                                      updateInvestorRow(row.rowId, "note", value)
                                    }
                                    placeholder="Primary lender"
                                  />
                                </div>
                              )}
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={addInvestorRow}
                            className="rounded-2xl border border-dashed border-slate-400 px-4 py-2 text-sm font-medium text-slate-700"
                          >
                            + Add another investor
                          </button>
                        </div>
                      ) : null}
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Notes
                      </label>
                      <textarea
                        value={investmentForm.notes}
                        onChange={(e) =>
                          updateInvestmentForm("notes", e.target.value)
                        }
                        rows={4}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none ring-0 transition focus:border-slate-900"
                        placeholder="Add remarks about the investment"
                      />
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <button
                        type="submit"
                        className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
                      >
                        Save investment
                      </button>
                      <button
                        type="button"
                        onClick={resetAllForms}
                        className="rounded-2xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700"
                      >
                        Reset form
                      </button>
                    </div>
                  </form>
                </section>
              ) : null}

              {tab === "investment" ? (
                selectedInvestment ? (
                  <section className="space-y-6">
                    <div className="rounded-3xl bg-white p-6 shadow">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                          <h2 className="text-2xl font-semibold text-slate-900">
                            {selectedInvestment.company}
                          </h2>
                          <p className="mt-1 text-sm text-slate-600">
                            Invoice: {selectedInvestment.invoice || "-"} • Maturity:{" "}
                            {shortDate(selectedInvestment.maturityDate)}
                          </p>
                          <p className="mt-3 text-sm text-slate-600">
                            {selectedInvestment.notes || "No notes added."}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                          {selectedMetrics.settlementStatus}
                        </span>
                      </div>

                      <div className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                        <MetricCard
                          label="Invested"
                          value={currency(selectedInvestment.amount)}
                        />
                        <MetricCard
                          label="Borrowed"
                          value={currency(selectedMetrics.totalBorrowed)}
                        />
                        <MetricCard
                          label="Profit Generated"
                          value={currency(selectedMetrics.totalProfitGenerated)}
                        />
                        <MetricCard
                          label="Profit Payable"
                          value={currency(selectedMetrics.totalProfitPayable)}
                        />
                        <MetricCard
                          label="Profit Paid"
                          value={currency(selectedMetrics.totalPaid)}
                        />
                        <MetricCard
                          label="Outstanding"
                          value={currency(selectedMetrics.outstanding)}
                        />
                      </div>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-2">
                      <section className="rounded-3xl bg-white p-6 shadow">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Add profit entry
                        </h3>
                        <form onSubmit={addProfit} className="mt-4 space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <Input
                              label="Date"
                              type="date"
                              value={profitForm.date}
                              onChange={(value) =>
                                setProfitForm((prev) => ({ ...prev, date: value }))
                              }
                            />
                            <Input
                              label="Generated Profit"
                              type="number"
                              value={profitForm.generatedAmount}
                              onChange={(value) =>
                                setProfitForm((prev) => ({
                                  ...prev,
                                  generatedAmount: value,
                                }))
                              }
                              placeholder="50000"
                            />
                            <Input
                              label="Payable Profit"
                              type="number"
                              value={profitForm.payableAmount}
                              onChange={(value) =>
                                setProfitForm((prev) => ({
                                  ...prev,
                                  payableAmount: value,
                                }))
                              }
                              placeholder="30000"
                            />
                            <Input
                              label="Note"
                              value={profitForm.note}
                              onChange={(value) =>
                                setProfitForm((prev) => ({ ...prev, note: value }))
                              }
                              placeholder="Cycle 1"
                            />
                          </div>
                          <button
                            type="submit"
                            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                          >
                            Add profit
                          </button>
                        </form>
                      </section>

                      <section className="rounded-3xl bg-white p-6 shadow">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Add payment / cheque
                        </h3>
                        <form onSubmit={addPayment} className="mt-4 space-y-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <Input
                              label="Payment Date"
                              type="date"
                              value={paymentForm.paymentDate}
                              onChange={(value) =>
                                setPaymentForm((prev) => ({
                                  ...prev,
                                  paymentDate: value,
                                }))
                              }
                            />
                            <Input
                              label="Cheque Number"
                              value={paymentForm.chequeNumber}
                              onChange={(value) =>
                                setPaymentForm((prev) => ({
                                  ...prev,
                                  chequeNumber: value,
                                }))
                              }
                              placeholder="CHQ-001"
                            />
                            <Input
                              label="Bank"
                              value={paymentForm.bank}
                              onChange={(value) =>
                                setPaymentForm((prev) => ({ ...prev, bank: value }))
                              }
                              placeholder="Commercial Bank"
                            />
                            <Input
                              label="Amount"
                              type="number"
                              value={paymentForm.amount}
                              onChange={(value) =>
                                setPaymentForm((prev) => ({ ...prev, amount: value }))
                              }
                              placeholder="10000"
                            />
                            <Select
                              label="Status"
                              value={paymentForm.status}
                              onChange={(value) =>
                                setPaymentForm((prev) => ({ ...prev, status: value }))
                              }
                              options={["cleared", "pending", "bounced"]}
                              labels={{
                                cleared: "Cleared",
                                pending: "Pending",
                                bounced: "Bounced",
                              }}
                            />
                            <Input
                              label="Note"
                              value={paymentForm.note}
                              onChange={(value) =>
                                setPaymentForm((prev) => ({ ...prev, note: value }))
                              }
                              placeholder="First settlement"
                            />
                          </div>
                          <button
                            type="submit"
                            className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
                          >
                            Add payment
                          </button>
                        </form>
                      </section>
                    </div>

                    <div className="grid gap-6 xl:grid-cols-3">
                      <section className="rounded-3xl bg-white p-6 shadow xl:col-span-2">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-slate-900">
                            Profit history
                          </h3>
                          <span className="text-sm text-slate-500">
                            {(selectedInvestment.profits || []).length} entries
                          </span>
                        </div>
                        <DataTable
                          headers={["Date", "Generated", "Payable", "Note"]}
                          rows={(selectedInvestment.profits || []).map((item) => [
                            shortDate(item.date),
                            currency(item.generatedAmount),
                            currency(item.payableAmount),
                            item.note || "-",
                          ])}
                          emptyText="No profit entries yet."
                        />
                      </section>

                      <section className="rounded-3xl bg-white p-6 shadow">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-slate-900">
                            Linked investors
                          </h3>
                          <span className="text-sm text-slate-500">
                            {(selectedInvestment.linkedInvestors || []).length} linked
                          </span>
                        </div>
                        <div className="mt-4 space-y-3">
                          {(selectedInvestment.linkedInvestors || []).length === 0 ? (
                            <EmptyNotice text="No investors linked." />
                          ) : (
                            selectedInvestment.linkedInvestors.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-2xl border border-slate-200 p-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="font-semibold text-slate-900">
                                      {item.investorName}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                      {item.phone || "-"} {item.email ? `• ${item.email}` : ""}
                                    </p>
                                  </div>
                                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                                    {item.sharePercent || 0}%
                                  </span>
                                </div>
                                <p className="mt-3 text-sm text-slate-700">
                                  Contribution: {currency(item.contribution)}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {item.note || "No note"}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </section>
                    </div>

                    <section className="rounded-3xl bg-white p-6 shadow">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-slate-900">
                          Payments / cheques
                        </h3>
                        <span className="text-sm text-slate-500">
                          {(selectedInvestment.payments || []).length} entries
                        </span>
                      </div>

                      <DataTable
                        headers={["Date", "Cheque No", "Bank", "Amount", "Status", "Note"]}
                        rows={(selectedInvestment.payments || []).map((item) => [
                          shortDate(item.paymentDate),
                          item.chequeNumber || "-",
                          item.bank || "-",
                          currency(item.amount),
                          item.status,
                          item.note || "-",
                        ])}
                        emptyText="No payments yet."
                      />
                    </section>
                  </section>
                ) : (
                  <section className="rounded-3xl bg-white p-8 shadow">
                    Select an investment.
                  </section>
                )
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function DashboardView({ investments, onOpenInvestment }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-slate-900">
          Investment overview
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Clean dashboard by investment, with payable-based settlement.
        </p>
      </div>

      <div className="space-y-4">
        {investments.map((investment) => {
          const metrics = getInvestmentMetrics(investment);
          return (
            <div
              key={investment.id}
              className="rounded-3xl border border-slate-200 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {investment.company}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {investment.invoice || "No invoice"} • {investment.status}
                  </p>
                </div>

                <button
                  onClick={() => onOpenInvestment(investment.id)}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                  Open
                </button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-4">
                <MetricCard label="Invested" value={currency(investment.amount)} />
                <MetricCard
                  label="Profit Payable"
                  value={currency(metrics.totalProfitPayable)}
                />
                <MetricCard label="Profit Paid" value={currency(metrics.totalPaid)} />
                <MetricCard
                  label="Outstanding"
                  value={currency(metrics.outstanding)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value, active }) {
  return (
    <div className={`rounded-xl p-2 ${active ? "bg-white/10" : "bg-white"}`}>
      <p className={`text-[10px] ${active ? "text-slate-300" : "text-slate-500"}`}>
        {label}
      </p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  labels = {},
  placeholder = "Select",
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-900"
      >
        <option value="">{placeholder}</option>
        {options.map((item) => (
          <option key={item} value={item}>
            {labels[item] || item}
          </option>
        ))}
      </select>
    </div>
  );
}

function DataTable({ headers, rows, emptyText }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
      {rows.length === 0 ? (
        <div className="p-6">
          <EmptyNotice text={emptyText} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {headers.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row, index) => (
                <tr key={index}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="whitespace-nowrap px-4 py-3 text-sm text-slate-700"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyNotice({ text }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
      {text}
    </div>
  );
}

function buttonClass(active) {
  return `rounded-2xl px-4 py-2 text-sm font-medium transition ${
    active
      ? "bg-white text-slate-900"
      : "bg-white/10 text-white hover:bg-white/20"
  }`;
}
