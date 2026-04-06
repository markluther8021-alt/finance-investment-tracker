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

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB");
};

const addDays = (dateStr, days) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

export default function Page() {
  const [investments, setInvestments] = useState([]);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState("");

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [investmentName, setInvestmentName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [investmentDate, setInvestmentDate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");

  const [showReinvestBoxId, setShowReinvestBoxId] = useState("");
  const [reinvestInvoiceNumber, setReinvestInvoiceNumber] = useState("");
  const [reinvestInvestmentDate, setReinvestInvestmentDate] = useState("");
  const [reinvestMaturityDate, setReinvestMaturityDate] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setInvestments(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(investments));
  }, [investments]);

  const selectedInvestment = useMemo(
    () => investments.find((i) => i.id === selectedInvestmentId),
    [investments, selectedInvestmentId]
  );

  // ---------- SAVE ----------
  const saveInvestment = () => {
    if (!invoiceNumber || !investmentName || !totalAmount) {
      setError("Fill all fields");
      return;
    }

    const exists = investments.find(
      (i) => i.invoiceNumber === invoiceNumber
    );
    if (exists) {
      setError("Invoice already exists");
      return;
    }

    const newInv = {
      id: generateId(),
      invoiceNumber,
      investmentName,
      totalAmount: Number(totalAmount),
      investmentDate,
      maturityDate,
      status: "active",
      parentInvestmentId: null,
    };

    setInvestments([newInv, ...investments]);
    setSelectedInvestmentId(newInv.id);
    setSuccess("Saved");
    setError("");
  };

  // ---------- MATURE ----------
  const markAsMatured = (id) => {
    setInvestments((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, status: "matured" } : i
      )
    );
  };

  // ---------- REINVEST CHECK ----------
  const canReinvest = (inv) => {
    if (inv.status !== "matured") return false;

    const already = investments.some(
      (i) => i.parentInvestmentId === inv.id
    );

    return !already;
  };

  // ---------- OPEN BOX ----------
  const openReinvestBox = (inv) => {
    if (!canReinvest(inv)) {
      setError("Must be matured and not already reinvested");
      return;
    }

    setShowReinvestBoxId(inv.id);
    setReinvestInvoiceNumber("");
    setReinvestInvestmentDate(addDays(inv.maturityDate, 10));
    setReinvestMaturityDate(inv.maturityDate);
  };

  const cancelReinvestBox = () => {
    setShowReinvestBoxId("");
  };

  // ---------- CREATE REINVEST ----------
  const createReinvestment = (parent) => {
    if (!canReinvest(parent)) {
      setError("Invalid reinvestment");
      return;
    }

    if (!reinvestInvoiceNumber) {
      setError("Invoice required");
      return;
    }

    const duplicate = investments.find(
      (i) => i.invoiceNumber === reinvestInvoiceNumber
    );
    if (duplicate) {
      setError("Invoice exists");
      return;
    }

    const newInv = {
      id: generateId(),
      invoiceNumber: reinvestInvoiceNumber,
      investmentName: parent.investmentName + " - Re",
      totalAmount: parent.totalAmount,
      investmentDate: reinvestInvestmentDate,
      maturityDate: reinvestMaturityDate,
      status: "active",
      parentInvestmentId: parent.id,
    };

    setInvestments((prev) => [
      newInv,
      ...prev.map((i) =>
        i.id === parent.id
          ? { ...i, status: "reinvested" }
          : i
      ),
    ]);

    setSelectedInvestmentId(newInv.id);
    cancelReinvestBox();
    setSuccess("Reinvested");
    setError("");
  };

  // ---------- HISTORY ----------
  const getHistory = (inv) => {
    const chain = [];
    let current = inv;

    while (current) {
      chain.unshift(current);
      current = investments.find(
        (i) => i.id === current.parentInvestmentId
      );
    }

    return chain;
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Finance Investment Tracker</h1>

      {/* FORM */}
      <input placeholder="Invoice" value={invoiceNumber} onChange={e=>setInvoiceNumber(e.target.value)} />
      <input placeholder="Name" value={investmentName} onChange={e=>setInvestmentName(e.target.value)} />
      <input placeholder="Amount" value={totalAmount} onChange={e=>setTotalAmount(e.target.value)} />
      <input type="date" value={investmentDate} onChange={e=>setInvestmentDate(e.target.value)} />
      <input type="date" value={maturityDate} onChange={e=>setMaturityDate(e.target.value)} />
      <button onClick={saveInvestment}>Save</button>

      {error && <div style={{color:"red"}}>{error}</div>}
      {success && <div style={{color:"green"}}>{success}</div>}

      {/* LIST */}
      {investments.map(inv => {
        const showReinvest = canReinvest(inv);

        return (
          <div key={inv.id} style={{border:"1px solid #ccc",margin:10,padding:10}}>
            <b>{inv.investmentName}</b> | {inv.invoiceNumber} | {inv.status}

            <div>
              <button onClick={()=>markAsMatured(inv.id)}>Mature</button>

              {showReinvest && (
                <button onClick={()=>openReinvestBox(inv)}>Reinvest</button>
              )}
            </div>

            {showReinvestBoxId === inv.id && (
              <div>
                <input
                  placeholder="New Invoice"
                  value={reinvestInvoiceNumber}
                  onChange={(e)=>setReinvestInvoiceNumber(e.target.value)}
                />
                <button onClick={()=>createReinvestment(inv)}>Confirm</button>
                <button onClick={cancelReinvestBox}>Cancel</button>
              </div>
            )}
          </div>
        );
      })}

      {/* HISTORY */}
      {selectedInvestment && (
        <div>
          <h3>History</h3>
          {getHistory(selectedInvestment).map(i=>(
            <div key={i.id}>
              {i.invoiceNumber} → {i.status}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
