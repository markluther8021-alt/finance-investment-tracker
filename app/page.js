"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "finance-investment-tracker-module-1";
const generateId = () => Math.random().toString(36).slice(2, 10);

const formatDate = (d) => {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  return x.toISOString().split("T")[0];
};

const formatDisplayDate = (d) => {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  return x.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const addDays = (d, days) => {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  x.setDate(x.getDate() + days);
  return formatDate(x);
};

const formatCurrency = (v) =>
  `LKR ${Number(v || 0).toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const createBorrowedInvestor = () => ({
  id: generateId(),
  name: "",
  amount: "",
});

export default function Page() {
  const [investments, setInvestments] = useState([]);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState("");

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [investmentName, setInvestmentName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [borrowedAmount, setBorrowedAmount] = useState("");
  const [investmentDate, setInvestmentDate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");

  const [borrowedInvestors, setBorrowedInvestors] = useState([
    createBorrowedInvestor(),
  ]);

  const [showReinvestBoxId, setShowReinvestBoxId] = useState("");
  const [reinvestInvoiceNumber, setReinvestInvoiceNumber] = useState("");
  const [reinvestInvestmentDate, setReinvestInvestmentDate] = useState("");
  const [reinvestMaturityDate, setReinvestMaturityDate] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setInvestments(parsed.investments || []);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ investments })
    );
  }, [investments]);

  const selectedInvestment = useMemo(
    () => investments.find((i) => i.id === selectedInvestmentId),
    [investments, selectedInvestmentId]
  );

  const runningInvestments = useMemo(
    () => investments.filter((i) => i.status === "active"),
    [investments]
  );

  const currentInvestments = useMemo(
    () => investments.filter((i) => !i.parentInvestmentId),
    [investments]
  );

  const borrowedAmountNumber = Number(borrowedAmount || 0);
  const totalAmountNumber = Number(totalAmount || 0);
  const selfInvestedAmount = Math.max(totalAmountNumber - borrowedAmountNumber, 0);

  const hasChild = (id) =>
    investments.some((i) => i.parentInvestmentId === id);

  const canReinvest = (i) =>
    i.status === "matured" && !hasChild(i.id);

  const validate = () => {
    if (!invoiceNumber.trim()) return "Invoice required";
    if (!investmentName.trim()) return "Investment name required";
    if (!totalAmount || Number(totalAmount) <= 0) return "Total amount required";
    if (!investmentDate) return "Investment date required";
    if (!maturityDate) return "Maturity date required";

    if (borrowedAmountNumber > totalAmountNumber) {
      return "Borrowed amount cannot exceed total amount";
    }

    const start = new Date(investmentDate);
    const end = new Date(maturityDate);
    if (end < start) return "Maturity cannot be before investment date";

    const dup = investments.find(
      (i) =>
        i.invoiceNumber.trim().toLowerCase() ===
        invoiceNumber.trim().toLowerCase()
    );
    if (dup) return "Duplicate invoice";

    return "";
  };

  const saveInvestment = () => {
    const err = validate();
    if (err) {
      setError(err);
      setSuccess("");
      return;
    }

    const total = Number(totalAmount);
    const borrowed = Number(borrowedAmount || 0);

    const newInv = {
      id: generateId(),
      invoiceNumber: invoiceNumber.trim(),
      investmentName: investmentName.trim(),
      totalAmount: total,
      borrowedAmount: borrowed,
      selfInvestedAmount: total - borrowed,
      investmentDate,
      maturityDate,
      borrowedInvestors:
        borrowed > 0
          ? borrowedInvestors
              .filter((x) => x.name.trim() || x.amount)
              .map((x) => ({
                ...x,
                id: x.id || generateId(),
                name: x.name.trim(),
                amount: Number(x.amount || 0),
              }))
          : [],
      status: "active",
      parentInvestmentId: null,
    };

    setInvestments((p) => [newInv, ...p]);
    setInvoiceNumber("");
    setInvestmentName("");
    setTotalAmount("");
    setBorrowedAmount("");
    setInvestmentDate("");
    setMaturityDate("");
    setBorrowedInvestors([createBorrowedInvestor()]);
    setSuccess("Saved");
    setError("");
  };

  const markAsMatured = (id) => {
    setInvestments((p) =>
      p.map((i) =>
        i.id === id ? { ...i, status: "matured" } : i
      )
    );
    setSuccess("Investment marked as matured");
    setError("");
  };

  const openReinvestBox = (inv) => {
    setShowReinvestBoxId(inv.id);
    setReinvestInvoiceNumber("");
    setReinvestInvestmentDate(addDays(inv.maturityDate, 10));
    setReinvestMaturityDate(inv.maturityDate || "");
    setError("");
    setSuccess("");
  };

  const createReinvestment = (inv) => {
    setError("");
    setSuccess("");

    if (inv.status !== "matured") {
      setError("Reinvestment allowed only after maturity");
      return;
    }

    if (hasChild(inv.id)) {
      setError("This investment already has a reinvestment");
      return;
    }

    if (!reinvestInvoiceNumber.trim()) {
      setError("New invoice required");
      return;
    }

    const duplicate = investments.find(
      (i) =>
        i.invoiceNumber.trim().toLowerCase() ===
        reinvestInvoiceNumber.trim().toLowerCase()
    );
    if (duplicate) {
      setError("Invoice already exists");
      return;
    }

    if (!reinvestInvestmentDate || !reinvestMaturityDate) {
      setError("Reinvestment dates required");
      return;
    }

    const reinvestStart = new Date(reinvestInvestmentDate);
    const reinvestEnd = new Date(reinvestMaturityDate);
    if (reinvestEnd < reinvestStart) {
      setError("Reinvestment maturity cannot be before reinvestment date");
      return;
    }

    const reinv = {
      ...inv,
      id: generateId(),
      invoiceNumber: reinvestInvoiceNumber.trim(),
      investmentDate: reinvestInvestmentDate,
      maturityDate: reinvestMaturityDate,
      parentInvestmentId: inv.id,
      status: "active",
      borrowedInvestors: (inv.borrowedInvestors || []).map((x) => ({
        ...x,
        id: generateId(),
      })),
    };

    setInvestments((p) => [
      reinv,
      ...p.map((i) =>
        i.id === inv.id ? { ...i, status: "reinvested" } : i
      ),
    ]);

    setSelectedInvestmentId(reinv.id);
    setShowReinvestBoxId("");
    setReinvestInvoiceNumber("");
    setReinvestInvestmentDate("");
    setReinvestMaturityDate("");
    setSuccess("Reinvestment created");
  };

  const getHistory = (inv) => {
    if (!inv) return [];
    const arr = [];
    let current = inv;
    while (current) {
      arr.unshift(current);
      current = investments.find((i) => i.id === current.parentInvestmentId);
    }
    return arr;
  };

  const selectedHistory = useMemo(
    () => getHistory(selectedInvestment),
    [selectedInvestment, investments]
  );

  return (
    <div style={{ padding: 20 }}>
      <h2>Investment Tracker</h2>

      <div style={{ marginBottom: 20 }}>
        <input
          value={invoiceNumber}
          onChange={(e) => setInvoiceNumber(e.target.value)}
          placeholder="Invoice"
        />
        <input
          value={investmentName}
          onChange={(e) => setInvestmentName(e.target.value)}
          placeholder="Name"
        />
        <input
          type="number"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          placeholder="Total"
        />
        <input
          type="number"
          value={borrowedAmount}
          onChange={(e) => setBorrowedAmount(e.target.value)}
          placeholder="Borrowed"
        />
        <input
          type="date"
          value={investmentDate}
          onChange={(e) => setInvestmentDate(e.target.value)}
        />
        <input
          type="date"
          value={maturityDate}
          onChange={(e) => setMaturityDate(e.target.value)}
        />
        <button onClick={saveInvestment}>Save</button>

        <div style={{ marginTop: 10 }}>
          <div>Total: {formatCurrency(totalAmountNumber)}</div>
          <div>Borrowed: {formatCurrency(borrowedAmountNumber)}</div>
          <div>Self: {formatCurrency(selfInvestedAmount)}</div>
        </div>
      </div>

      {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ color: "green", marginBottom: 12 }}>{success}</div>}

      <div style={{ marginBottom: 20 }}>
        <div>Running: {runningInvestments.length}</div>
        <div>Current: {currentInvestments.length}</div>
      </div>

      {investments.map((i) => (
        <div
          key={i.id}
          onClick={() => setSelectedInvestmentId(i.id)}
          style={{
            border: "1px solid #ccc",
            padding: 12,
            marginBottom: 12,
            cursor: "pointer",
          }}
        >
          <div>
            <b>{i.invoiceNumber}</b> - {i.investmentName}
          </div>
          <div>Status: {i.status}</div>
          <div>Total: {formatCurrency(i.totalAmount)}</div>
          <div>Borrowed: {formatCurrency(i.borrowedAmount)}</div>
          <div>Self: {formatCurrency(i.selfInvestedAmount)}</div>
          <div>
            {formatDisplayDate(i.investmentDate)} → {formatDisplayDate(i.maturityDate)}
          </div>

          {i.status === "active" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                markAsMatured(i.id);
              }}
            >
              Mature
            </button>
          )}

          {canReinvest(i) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openReinvestBox(i);
              }}
            >
              Reinvest
            </button>
          )}

          {showReinvestBoxId === i.id && (
            <div
              style={{ marginTop: 10 }}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                placeholder="New Invoice"
                value={reinvestInvoiceNumber}
                onChange={(e) => setReinvestInvoiceNumber(e.target.value)}
              />
              <input
                type="date"
                value={reinvestInvestmentDate}
                onChange={(e) => setReinvestInvestmentDate(e.target.value)}
              />
              <input
                type="date"
                value={reinvestMaturityDate}
                onChange={(e) => setReinvestMaturityDate(e.target.value)}
              />
              <button onClick={() => createReinvestment(i)}>Create</button>
            </div>
          )}
        </div>
      ))}

      {selectedInvestment && (
        <div style={{ marginTop: 24 }}>
          <h3>Current Investment Summary</h3>
          <div>Invoice: {selectedInvestment.invoiceNumber}</div>
          <div>Name: {selectedInvestment.investmentName}</div>
          <div>Total: {formatCurrency(selectedInvestment.totalAmount)}</div>
          <div>Borrowed: {formatCurrency(selectedInvestment.borrowedAmount)}</div>
          <div>Self: {formatCurrency(selectedInvestment.selfInvestedAmount)}</div>
          <div>Start: {formatDisplayDate(selectedInvestment.investmentDate)}</div>
          <div>Maturity: {formatDisplayDate(selectedInvestment.maturityDate)}</div>

          <h3 style={{ marginTop: 20 }}>History</h3>
          {selectedHistory.map((h, i) => (
            <div
              key={h.id}
              style={{
                border: "1px solid #ddd",
                padding: 10,
                marginBottom: 8,
              }}
            >
              <div>Step {i + 1}</div>
              <div>Invoice: {h.invoiceNumber}</div>
              <div>Date: {formatDisplayDate(h.investmentDate)}</div>
              <div>Maturity: {formatDisplayDate(h.maturityDate)}</div>
              <div>Status: {h.status}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
