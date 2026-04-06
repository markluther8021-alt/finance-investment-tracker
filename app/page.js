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

const createBorrowedInvestor = () => ({
  id: generateId(),
  name: "",
  amount: "",
});

export default function Page() {
  const [investments, setInvestments] = useState([]);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState("");

  const [search, setSearch] = useState(""); // NEW
  const [editId, setEditId] = useState(""); // NEW

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [investmentName, setInvestmentName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [borrowedAmount, setBorrowedAmount] = useState("");
  const [investmentDate, setInvestmentDate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");

  const [borrowedInvestors, setBorrowedInvestors] = useState([
    createBorrowedInvestor(),
  ]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      setInvestments(parsed.investments || []);
      setSelectedInvestmentId(parsed.selectedInvestmentId || "");
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ investments, selectedInvestmentId })
    );
  }, [investments, selectedInvestmentId, loaded]);

  const borrowedAmountNumber = Number(borrowedAmount || 0);
  const totalAmountNumber = Number(totalAmount || 0);
  const selfInvestedAmount = totalAmountNumber - borrowedAmountNumber;

  // ✅ FIX DASHBOARD (exclude reinvestments)
  const baseInvestments = useMemo(() => {
    return investments.filter((i) => !i.parentInvestmentId);
  }, [investments]);

  const totalPortfolioAmount = useMemo(() => {
    return baseInvestments.reduce((s, i) => s + i.totalAmount, 0);
  }, [baseInvestments]);

  const totalBorrowedPortfolioAmount = useMemo(() => {
    return baseInvestments.reduce((s, i) => s + i.borrowedAmount, 0);
  }, [baseInvestments]);

  const totalSelfInvestedPortfolioAmount = useMemo(() => {
    return baseInvestments.reduce((s, i) => s + i.selfInvestedAmount, 0);
  }, [baseInvestments]);

  // ✅ SEARCH
  const filteredInvestments = investments.filter(
    (i) =>
      i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      i.investmentName.toLowerCase().includes(search.toLowerCase())
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

  const validateForm = () => {
    if (!invoiceNumber.trim()) return "Invoice required";

    // ✅ DUPLICATE CHECK
    const duplicate = investments.find(
      (i) => i.invoiceNumber === invoiceNumber && i.id !== editId
    );
    if (duplicate) return "Invoice already exists";

    if (borrowedAmountNumber > totalAmountNumber)
      return "Borrowed > total";

    return "";
  };

  const saveInvestment = () => {
    const err = validateForm();
    if (err) {
      setError(err);
      return;
    }

    const newInvestment = {
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
        prev.map((i) => (i.id === editId ? newInvestment : i))
      );
    } else {
      setInvestments((prev) => [newInvestment, ...prev]);
    }

    resetForm();
    setSuccess("Saved");
    setError("");
  };

  const editInvestment = (i) => {
    setEditId(i.id);
    setInvoiceNumber(i.invoiceNumber);
    setInvestmentName(i.investmentName);
    setTotalAmount(i.totalAmount);
    setBorrowedAmount(i.borrowedAmount);
    setInvestmentDate(i.investmentDate);
    setMaturityDate(i.maturityDate);
  };

  const deleteInvestment = (id) => {
    if (!confirm("Delete investment?")) return;
    setInvestments((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <main className="page">
      <div className="container">

        <h2>Investment Tracker</h2>

        {/* FORM */}
        <input value={invoiceNumber} onChange={(e)=>setInvoiceNumber(e.target.value)} placeholder="Invoice"/>
        <input value={investmentName} onChange={(e)=>setInvestmentName(e.target.value)} placeholder="Name"/>
        <input type="number" value={totalAmount} onChange={(e)=>setTotalAmount(e.target.value)} placeholder="Total"/>
        <input type="number" value={borrowedAmount} onChange={(e)=>setBorrowedAmount(e.target.value)} placeholder="Borrowed"/>
        <input type="date" value={investmentDate} onChange={(e)=>setInvestmentDate(e.target.value)}/>
        <input type="date" value={maturityDate} onChange={(e)=>setMaturityDate(e.target.value)}/>

        <button onClick={saveInvestment}>
          {editId ? "Update" : "Save"}
        </button>

        {/* SEARCH */}
        <input
          placeholder="Search invoice or name"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* DASHBOARD */}
        <div>
          <div>Total: {formatCurrency(totalPortfolioAmount)}</div>
          <div>Borrowed: {formatCurrency(totalBorrowedPortfolioAmount)}</div>
          <div>Self: {formatCurrency(totalSelfInvestedPortfolioAmount)}</div>
        </div>

        {/* LIST */}
        {filteredInvestments.map((i) => (
          <div key={i.id}>
            <b>{i.investmentName}</b> ({i.invoiceNumber})
            <div>{formatCurrency(i.totalAmount)}</div>

            <button onClick={()=>editInvestment(i)}>Edit</button>
            <button onClick={()=>deleteInvestment(i.id)}>Delete</button>
          </div>
        ))}

      </div>
    </main>
  );
}
