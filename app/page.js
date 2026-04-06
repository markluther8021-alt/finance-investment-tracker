"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "finance-investment-tracker-module-1";

const generateId = () => Math.random().toString(36).slice(2, 10);

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const addDays = (dateStr, days) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

const formatCurrency = (value) => {
  const number = Number(value || 0);
  return number.toLocaleString("en-LK", {
    style: "currency",
    currency: "LKR",
  });
};

export default function Page() {
  const [investments, setInvestments] = useState([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [investmentName, setInvestmentName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [borrowedAmount, setBorrowedAmount] = useState("");
  const [investmentDate, setInvestmentDate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");

  const [editId, setEditId] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const totalAmountNumber = Number(totalAmount || 0);
  const borrowedAmountNumber = Number(borrowedAmount || 0);
  const selfInvestedAmount = Math.max(
    totalAmountNumber - borrowedAmountNumber,
    0
  );

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setInvestments(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(investments));
  }, [investments]);

  // ✅ exclude reinvestments
  const baseInvestments = useMemo(
    () => investments.filter((i) => !i.parentInvestmentId),
    [investments]
  );

  const totalPortfolio = baseInvestments.reduce(
    (sum, i) => sum + i.totalAmount,
    0
  );

  const totalBorrowed = baseInvestments.reduce(
    (sum, i) => sum + i.borrowedAmount,
    0
  );

  const totalSelf = baseInvestments.reduce(
    (sum, i) => sum + i.selfInvestedAmount,
    0
  );

  const resetForm = () => {
    setInvoiceNumber("");
    setInvestmentName("");
    setTotalAmount("");
    setBorrowedAmount("");
    setInvestmentDate("");
    setMaturityDate("");
    setEditId("");
  };

  const saveInvestment = () => {
    if (!invoiceNumber) return alert("Invoice required");

    // ✅ duplicate check
    const duplicate = investments.find(
      (i) =>
        i.invoiceNumber.toLowerCase() === invoiceNumber.toLowerCase() &&
        i.id !== editId
    );
    if (duplicate) return alert("Duplicate invoice");

    const data = {
      id: editId || generateId(),
      invoiceNumber,
      investmentName,
      totalAmount: totalAmountNumber,
      borrowedAmount: borrowedAmountNumber,
      selfInvestedAmount,
      investmentDate,
      maturityDate,
      status: "active",
      parentInvestmentId: null,
    };

    if (editId) {
      setInvestments((prev) =>
        prev.map((i) => (i.id === editId ? data : i))
      );
    } else {
      setInvestments((prev) => [data, ...prev]);
    }

    resetForm();
  };

  const deleteInvestment = (id) => {
    if (!confirm("Delete?")) return;
    setInvestments((prev) => prev.filter((i) => i.id !== id));
  };

  const startEdit = (i) => {
    setEditId(i.id);
    setInvoiceNumber(i.invoiceNumber);
    setInvestmentName(i.investmentName);
    setTotalAmount(i.totalAmount);
    setBorrowedAmount(i.borrowedAmount);
    setInvestmentDate(i.investmentDate);
    setMaturityDate(i.maturityDate);
  };

  const createReinvestment = (i) => {
    const invoice = prompt("New invoice?");
    if (!invoice) return;

    const duplicate = investments.find(
      (x) => x.invoiceNumber.toLowerCase() === invoice.toLowerCase()
    );
    if (duplicate) return alert("Duplicate invoice");

    const reinvest = {
      ...i,
      id: generateId(),
      invoiceNumber: invoice,
      parentInvestmentId: i.id,
      investmentDate: addDays(i.maturityDate, 10),
      status: "active",
    };

    setInvestments((prev) =>
      [reinvest, ...prev.map((x) =>
        x.id === i.id ? { ...x, status: "reinvested" } : x
      )]
    );
  };

  const filtered = investments.filter((i) => {
    const matchSearch =
      i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.investmentName.toLowerCase().includes(search.toLowerCase());

    const matchFilter =
      filter === "all" ||
      (filter === "reinvestment" && i.parentInvestmentId) ||
      (filter === "self" && i.borrowedAmount === 0) ||
      (filter === "borrowed" && i.borrowedAmount > 0);

    return matchSearch && matchFilter;
  });

  return (
    <div style={{ padding: 20 }}>
      <h2>Investment Tracker</h2>

      {/* FORM */}
      <input placeholder="Invoice" value={invoiceNumber} onChange={(e)=>setInvoiceNumber(e.target.value)} />
      <input placeholder="Name" value={investmentName} onChange={(e)=>setInvestmentName(e.target.value)} />
      <input placeholder="Total" type="number" value={totalAmount} onChange={(e)=>setTotalAmount(e.target.value)} />
      <input placeholder="Borrowed" type="number" value={borrowedAmount} onChange={(e)=>setBorrowedAmount(e.target.value)} />
      <input type="date" value={investmentDate} onChange={(e)=>setInvestmentDate(e.target.value)} />
      <input type="date" value={maturityDate} onChange={(e)=>setMaturityDate(e.target.value)} />

      <button onClick={saveInvestment}>
        {editId ? "Update" : "Save"}
      </button>

      {/* DASHBOARD */}
      <h3>Dashboard</h3>
      <div>Total: {formatCurrency(totalPortfolio)}</div>
      <div>Self: {formatCurrency(totalSelf)}</div>
      <div>Borrowed: {formatCurrency(totalBorrowed)}</div>

      {/* SEARCH */}
      <input placeholder="Search..." value={search} onChange={(e)=>setSearch(e.target.value)} />
      <select value={filter} onChange={(e)=>setFilter(e.target.value)}>
        <option value="all">All</option>
        <option value="self">Self</option>
        <option value="borrowed">Borrowed</option>
        <option value="reinvestment">Reinvestment</option>
      </select>

      {/* LIST */}
      {filtered.map((i) => (
        <div key={i.id} style={{ border: "1px solid #ccc", padding: 10, marginTop: 10 }}>
          <div>{i.investmentName}</div>
          <div>{i.invoiceNumber}</div>
          <div>{formatCurrency(i.totalAmount)}</div>

          <button onClick={() => startEdit(i)}>Edit</button>
          <button onClick={() => deleteInvestment(i.id)}>Delete</button>
          <button onClick={() => createReinvestment(i)}>Reinvest</button>
        </div>
      ))}
    </div>
  );
}
