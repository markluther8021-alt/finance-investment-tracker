"use client";

import { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "finance-investment-tracker-module-1";

const generateId = () => Math.random().toString(36).slice(2, 10);

const formatCurrency = (value) => {
  return Number(value || 0).toLocaleString("en-LK", {
    style: "currency",
    currency: "LKR",
  });
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB");
};

const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

export default function Page() {
  const [investments, setInvestments] = useState([]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    id: "",
    invoice: "",
    name: "",
    total: "",
    borrowed: "",
    date: "",
    maturity: "",
  });

  const isEdit = !!form.id;

  // LOAD
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setInvestments(JSON.parse(saved));
  }, []);

  // SAVE
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(investments));
  }, [investments]);

  // DASHBOARD (exclude reinvestments)
  const baseInvestments = investments.filter((i) => !i.parentId);

  const totals = {
    total: baseInvestments.reduce((s, i) => s + i.total, 0),
    borrowed: baseInvestments.reduce((s, i) => s + i.borrowed, 0),
    self: baseInvestments.reduce((s, i) => s + i.self, 0),
  };

  // SEARCH
  const filtered = investments.filter(
    (i) =>
      i.invoice.toLowerCase().includes(search.toLowerCase()) ||
      i.name.toLowerCase().includes(search.toLowerCase())
  );

  // SAVE / UPDATE
  const saveInvestment = () => {
    if (!form.invoice.trim()) return alert("Invoice required");

    const duplicate = investments.find(
      (i) => i.invoice === form.invoice && i.id !== form.id
    );
    if (duplicate) return alert("Duplicate invoice");

    const total = Number(form.total);
    const borrowed = Number(form.borrowed || 0);

    if (borrowed > total) return alert("Borrowed cannot exceed total");

    const newObj = {
      id: form.id || generateId(),
      invoice: form.invoice,
      name: form.name,
      total,
      borrowed,
      self: total - borrowed,
      date: form.date,
      maturity: form.maturity,
      status: "active",
      parentId: null,
    };

    setInvestments((prev) =>
      isEdit
        ? prev.map((i) => (i.id === form.id ? newObj : i))
        : [newObj, ...prev]
    );

    setForm({
      id: "",
      invoice: "",
      name: "",
      total: "",
      borrowed: "",
      date: "",
      maturity: "",
    });
  };

  // EDIT
  const handleEdit = (item) => {
    setForm({ ...item });
  };

  // DELETE
  const handleDelete = (id) => {
    if (!confirm("Delete investment?")) return;
    setInvestments((prev) => prev.filter((i) => i.id !== id));
  };

  // REINVEST
  const handleReinvest = (item) => {
    const newInvoice = prompt("Enter new invoice number");
    if (!newInvoice) return;

    if (investments.find((i) => i.invoice === newInvoice)) {
      alert("Duplicate invoice");
      return;
    }

    const newInvestment = {
      ...item,
      id: generateId(),
      invoice: newInvoice,
      date: addDays(item.maturity, 10),
      status: "active",
      parentId: item.id,
    };

    setInvestments((prev) => [
      newInvestment,
      ...prev.map((i) =>
        i.id === item.id ? { ...i, status: "reinvested" } : i
      ),
    ]);
  };

  const statusColor = (status) => {
    if (status === "active") return "green";
    if (status === "matured") return "orange";
    return "gray";
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Investment Tracker</h2>

      {/* FORM */}
      <div>
        <input
          placeholder="Invoice"
          value={form.invoice}
          onChange={(e) => setForm({ ...form, invoice: e.target.value })}
        />
        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Total"
          value={form.total}
          onChange={(e) => setForm({ ...form, total: e.target.value })}
        />
        <input
          type="number"
          placeholder="Borrowed"
          value={form.borrowed}
          onChange={(e) => setForm({ ...form, borrowed: e.target.value })}
        />
        <input
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <input
          type="date"
          value={form.maturity}
          onChange={(e) => setForm({ ...form, maturity: e.target.value })}
        />

        <button onClick={saveInvestment}>
          {isEdit ? "Update" : "Save"}
        </button>
      </div>

      {/* SEARCH */}
      <input
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginTop: 10 }}
      />

      {/* DASHBOARD */}
      <div style={{ marginTop: 20 }}>
        <div>Total: {formatCurrency(totals.total)}</div>
        <div>Borrowed: {formatCurrency(totals.borrowed)}</div>
        <div>Self: {formatCurrency(totals.self)}</div>
      </div>

      {/* LIST */}
      <div style={{ marginTop: 20 }}>
        {filtered.map((i) => (
          <div key={i.id} style={{ border: "1px solid #ccc", padding: 10 }}>
            <b>{i.name}</b> ({i.invoice})
            <div style={{ color: statusColor(i.status) }}>{i.status}</div>

            <div>{formatCurrency(i.total)}</div>
            <div>
              {formatDate(i.date)} → {formatDate(i.maturity)}
            </div>

            <button onClick={() => handleEdit(i)}>Edit</button>
            <button onClick={() => handleDelete(i.id)}>Delete</button>
            <button onClick={() => handleReinvest(i)}>Reinvest</button>
          </div>
        ))}
      </div>
    </div>
  );
}
