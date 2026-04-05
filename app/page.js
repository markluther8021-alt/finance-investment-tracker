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
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-GB");
};

const addDays = (dateStr, days) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

const getDateDifferenceInDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

const formatCurrency = (value) => {
  const number = Number(value || 0);
  return number.toLocaleString("en-LK", {
    style: "currency",
    currency: "LKR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const createBorrowedInvestor = () => ({
  id: generateId(),
  name: "",
  amount: "",
});

const downloadFile = (filename, content, type) => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const escapeCsv = (value) => {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

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

  const [isEditingMain, setIsEditingMain] = useState(false);
  const [editingInvestmentId, setEditingInvestmentId] = useState("");

  const [editModeId, setEditModeId] = useState("");
  const [editMaturityDate, setEditMaturityDate] = useState("");
  const [editReinvestmentDate, setEditReinvestmentDate] = useState("");

  const [showReinvestBoxId, setShowReinvestBoxId] = useState("");
  const [reinvestInvoiceNumber, setReinvestInvoiceNumber] = useState("");
  const [reinvestInvestmentDate, setReinvestInvestmentDate] = useState("");
  const [reinvestMaturityDate, setReinvestMaturityDate] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setInvestments(parsed.investments || []);
        setSelectedInvestmentId(parsed.selectedInvestmentId || "");
      }
    } catch (err) {
      console.error("Failed to load saved data", err);
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
        selectedInvestmentId,
      })
    );
  }, [investments, selectedInvestmentId, loaded]);

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const borrowedAmountNumber = Number(borrowedAmount || 0);
  const totalAmountNumber = Number(totalAmount || 0);

  const selfInvestedAmount = useMemo(() => {
    const result = totalAmountNumber - borrowedAmountNumber;
    return result >= 0 ? result : 0;
  }, [totalAmountNumber, borrowedAmountNumber]);

  const borrowedInvestorTotal = useMemo(() => {
    return borrowedInvestors.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );
  }, [borrowedInvestors]);

  const selectedInvestment = useMemo(() => {
    return investments.find((item) => item.id === selectedInvestmentId) || null;
  }, [investments, selectedInvestmentId]);

  const originalInvestments = useMemo(() => {
    return investments.filter((item) => !item.parentInvestmentId);
  }, [investments]);

  const totalPortfolioAmount = useMemo(() => {
    return originalInvestments.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0
    );
  }, [originalInvestments]);

  const totalBorrowedPortfolioAmount = useMemo(() => {
    return originalInvestments.reduce(
      (sum, item) => sum + Number(item.borrowedAmount || 0),
      0
    );
  }, [originalInvestments]);

  const totalSelfInvestedPortfolioAmount = useMemo(() => {
    return originalInvestments.reduce(
      (sum, item) => sum + Number(item.selfInvestedAmount || 0),
      0
    );
  }, [originalInvestments]);

  const filteredInvestments = useMemo(() => {
    return investments.filter((item) => {
      const matchesSearch =
        !searchTerm.trim() ||
        item.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.investmentName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ? true : item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [investments, searchTerm, statusFilter]);

  const resetForm = () => {
    setInvoiceNumber("");
    setInvestmentName("");
    setTotalAmount("");
    setBorrowedAmount("");
    setInvestmentDate("");
    setMaturityDate("");
    setBorrowedInvestors([createBorrowedInvestor()]);
    setIsEditingMain(false);
    setEditingInvestmentId("");
  };

  const handleBorrowedInvestorChange = (id, field, value) => {
    setBorrowedInvestors((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const addBorrowedInvestor = () => {
    setBorrowedInvestors((prev) => [...prev, createBorrowedInvestor()]);
  };

  const removeBorrowedInvestor = (id) => {
    setBorrowedInvestors((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((item) => item.id !== id);
    });
  };

  const invoiceExists = (invoice, ignoreId = "") => {
    return investments.some(
      (item) =>
        item.id !== ignoreId &&
        item.invoiceNumber.trim().toLowerCase() === invoice.trim().toLowerCase()
    );
  };

  const validateForm = () => {
    if (!invoiceNumber.trim()) return "Invoice number is required";
    if (invoiceExists(invoiceNumber, editingInvestmentId)) {
      return "Invoice number already exists";
    }
    if (!investmentName.trim()) return "Investment name is required";
    if (!totalAmount || Number(totalAmount) <= 0) {
      return "Total investment amount must be greater than 0";
    }
    if (Number(borrowedAmount || 0) < 0) {
      return "Borrowed amount cannot be negative";
    }
    if (borrowedAmountNumber > totalAmountNumber) {
      return "Borrowed amount cannot exceed total investment";
    }
    if (!investmentDate) return "Investment date is required";
    if (!maturityDate) return "Maturity date is required";

    const start = new Date(investmentDate);
    const end = new Date(maturityDate);

    if (end < start) return "Maturity date cannot be before investment date";

    const hasBorrowedNamesOrAmounts =
      borrowedAmountNumber > 0 ||
      borrowedInvestors.some((item) => item.name.trim() || item.amount);

    if (hasBorrowedNamesOrAmounts) {
      const hasInvalidBorrowedInvestor = borrowedInvestors.some(
        (item) => !item.name.trim() || !item.amount || Number(item.amount) <= 0
      );

      if (borrowedAmountNumber > 0 && hasInvalidBorrowedInvestor) {
        return "Each borrowed investor must have a name and amount greater than 0";
      }

      if (
        borrowedAmountNumber > 0 &&
        borrowedInvestorTotal !== borrowedAmountNumber
      ) {
        return `Borrowed investor total (${formatCurrency(
          borrowedInvestorTotal
        )}) must equal borrowed amount (${formatCurrency(
          borrowedAmountNumber
        )})`;
      }
    }

    return "";
  };

  const saveInvestment = () => {
    clearMessages();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      invoiceNumber: invoiceNumber.trim(),
      investmentName: investmentName.trim(),
      totalAmount: totalAmountNumber,
      borrowedAmount: borrowedAmountNumber,
      selfInvestedAmount,
      investmentDate,
      maturityDate,
      borrowedInvestors:
        borrowedAmountNumber > 0
          ? borrowedInvestors.map((item) => ({
              ...item,
              name: item.name.trim(),
              amount: Number(item.amount),
            }))
          : [],
    };

    if (isEditingMain && editingInvestmentId) {
      setInvestments((prev) =>
        prev.map((item) =>
          item.id === editingInvestmentId ? { ...item, ...payload } : item
        )
      );
      setSelectedInvestmentId(editingInvestmentId);
      setSuccess("Investment updated successfully");
    } else {
      const newInvestment = {
        id: generateId(),
        ...payload,
        status: "active",
        parentInvestmentId: null,
      };

      setInvestments((prev) => [newInvestment, ...prev]);
      setSelectedInvestmentId(newInvestment.id);
      setSuccess("Investment saved successfully");
    }

    resetForm();
  };

  const startEditInvestment = (investment) => {
    setIsEditingMain(true);
    setEditingInvestmentId(investment.id);
    setInvoiceNumber(investment.invoiceNumber || "");
    setInvestmentName(investment.investmentName || "");
    setTotalAmount(String(investment.totalAmount || ""));
    setBorrowedAmount(String(investment.borrowedAmount || ""));
    setInvestmentDate(investment.investmentDate || "");
    setMaturityDate(investment.maturityDate || "");
    setBorrowedInvestors(
      investment.borrowedInvestors && investment.borrowedInvestors.length > 0
        ? investment.borrowedInvestors.map((item) => ({
            ...item,
            amount: String(item.amount ?? ""),
          }))
        : [createBorrowedInvestor()]
    );
    clearMessages();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const deleteInvestment = (investmentId) => {
    const target = investments.find((item) => item.id === investmentId);
    if (!target) return;

    const childIds = investments
      .filter((item) => item.parentInvestmentId === investmentId)
      .map((item) => item.id);

    const deleteIds = new Set([investmentId, ...childIds]);

    setInvestments((prev) => prev.filter((item) => !deleteIds.has(item.id)));

    if (selectedInvestmentId === investmentId || childIds.includes(selectedInvestmentId)) {
      setSelectedInvestmentId("");
    }

    if (editingInvestmentId === investmentId) {
      resetForm();
    }

    setSuccess(
      childIds.length > 0
        ? "Investment and related reinvestments deleted"
        : "Investment deleted"
    );
    setError("");
  };

  const markAsMatured = (investmentId) => {
    setInvestments((prev) =>
      prev.map((item) =>
        item.id === investmentId ? { ...item, status: "matured" } : item
      )
    );
    setSuccess("Investment marked as matured");
    setError("");
  };

  const startEditDates = (investment) => {
    setEditModeId(investment.id);
    setEditMaturityDate(investment.maturityDate || "");
    setEditReinvestmentDate(addDays(investment.maturityDate, 10));
    clearMessages();
  };

  const cancelEditDates = () => {
    setEditModeId("");
    setEditMaturityDate("");
    setEditReinvestmentDate("");
  };

  const saveEditDates = (investment) => {
    if (!editMaturityDate) {
      setError("Maturity date is required");
      return;
    }

    const investmentStart = new Date(investment.investmentDate);
    const maturity = new Date(editMaturityDate);

    if (maturity < investmentStart) {
      setError("Maturity date cannot be before investment date");
      return;
    }

    setInvestments((prev) =>
      prev.map((item) =>
        item.id === investment.id
          ? {
              ...item,
              maturityDate: editMaturityDate,
            }
          : item
      )
    );

    cancelEditDates();
    setSuccess("Maturity date updated successfully");
    setError("");
  };

  const openReinvestBox = (investment) => {
    setShowReinvestBoxId(investment.id);
    setReinvestInvoiceNumber("");

    const defaultInvestmentDate = addDays(investment.maturityDate, 10);
    const previousTermDays = getDateDifferenceInDays(
      investment.investmentDate,
      investment.maturityDate
    );
    const suggestedMaturityDate = addDays(defaultInvestmentDate, previousTermDays);

    setReinvestInvestmentDate(defaultInvestmentDate);
    setReinvestMaturityDate(suggestedMaturityDate);
    clearMessages();
  };

  const cancelReinvestBox = () => {
    setShowReinvestBoxId("");
    setReinvestInvoiceNumber("");
    setReinvestInvestmentDate("");
    setReinvestMaturityDate("");
  };

  const createReinvestment = (investment) => {
    if (!reinvestInvoiceNumber.trim()) {
      setError("New reinvestment invoice number is required");
      return;
    }

    if (invoiceExists(reinvestInvoiceNumber)) {
      setError("Invoice number already exists");
      return;
    }

    if (!reinvestInvestmentDate) {
      setError("Reinvestment date is required");
      return;
    }

    if (!reinvestMaturityDate) {
      setError("Reinvestment maturity date is required");
      return;
    }

    const reinvestStart = new Date(reinvestInvestmentDate);
    const reinvestEnd = new Date(reinvestMaturityDate);

    if (reinvestEnd < reinvestStart) {
      setError("Reinvestment maturity date cannot be before reinvestment date");
      return;
    }

    const reinvestment = {
      id: generateId(),
      invoiceNumber: reinvestInvoiceNumber.trim(),
      investmentName: `${investment.investmentName} - Reinvestment`,
      totalAmount: investment.totalAmount,
      borrowedAmount: investment.borrowedAmount,
      selfInvestedAmount: investment.selfInvestedAmount,
      investmentDate: reinvestInvestmentDate,
      maturityDate: reinvestMaturityDate,
      borrowedInvestors: (investment.borrowedInvestors || []).map((item) => ({
        ...item,
        id: generateId(),
      })),
      status: "active",
      parentInvestmentId: investment.id,
    };

    setInvestments((prev) => {
      const updated = prev.map((item) =>
        item.id === investment.id ? { ...item, status: "reinvested" } : item
      );
      return [reinvestment, ...updated];
    });

    setSelectedInvestmentId(reinvestment.id);
    cancelReinvestBox();
    setSuccess("Reinvestment created successfully");
    setError("");
  };

  const exportCsv = () => {
    const headers = [
      "Invoice Number",
      "Investment Name",
      "Record Type",
      "Status",
      "Total Amount",
      "Borrowed Amount",
      "Self Invested Amount",
      "Investment Date",
      "Maturity Date",
      "Parent Investment Id",
    ];

    const rows = investments.map((item) => [
      item.invoiceNumber,
      item.investmentName,
      item.parentInvestmentId ? "Reinvestment" : "Original",
      item.status,
      item.totalAmount,
      item.borrowedAmount,
      item.selfInvestedAmount,
      item.investmentDate,
      item.maturityDate,
      item.parentInvestmentId || "",
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    downloadFile("investment-module-data.csv", csv, "text/csv;charset=utf-8;");
  };

  const exportBackupJson = () => {
    downloadFile(
      "investment-module-backup.json",
      JSON.stringify({ investments, selectedInvestmentId }, null, 2),
      "application/json"
    );
  };

  const resetAllData = () => {
    setInvestments([]);
    setSelectedInvestmentId("");
    resetForm();
    setSearchTerm("");
    setStatusFilter("all");
    localStorage.removeItem(STORAGE_KEY);
    setSuccess("All data reset successfully");
    setError("");
  };

  const getStatusStyle = (status) => {
    if (status === "active") {
      return {
        background: "#dcfce7",
        color: "#166534",
      };
    }

    if (status === "matured") {
      return {
        background: "#fef3c7",
        color: "#92400e",
      };
    }

    if (status === "reinvested") {
      return {
        background: "#dbeafe",
        color: "#1d4ed8",
      };
    }

    return {
      background: "#e2e8f0",
      color: "#334155",
    };
  };

  return (
    <main className="page">
      <div className="container">
        <div className="card">
          <h1 className="header-title">Finance Investment Tracker</h1>
          <p className="header-subtitle">Module 1 - Investment Management</p>
        </div>

        <div className="grid main-grid" style={{ marginTop: 24 }}>
          <div className="card">
            <h2 className="section-title">
              {isEditingMain ? "Edit Investment" : "Add New Investment"}
            </h2>
            <p className="section-text">
              Total investment, borrowed amount, self-invested amount, invoice number, and dates.
            </p>

            <div className="form-grid">
              <div>
                <label>Invoice Number</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Enter invoice number"
                />
              </div>

              <div>
                <label>Investment Name</label>
                <input
                  type="text"
                  value={investmentName}
                  onChange={(e) => setInvestmentName(e.target.value)}
                  placeholder="Enter investment name"
                />
              </div>

              <div>
                <label>Total Investment Amount</label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="Enter total amount"
                />
              </div>

              <div>
                <label>Borrowed Amount</label>
                <input
                  type="number"
                  value={borrowedAmount}
                  onChange={(e) => setBorrowedAmount(e.target.value)}
                  placeholder="Enter borrowed amount"
                />
              </div>

              <div>
                <label>Self Invested Amount (Auto)</label>
                <input
                  type="text"
                  value={formatCurrency(selfInvestedAmount)}
                  readOnly
                />
              </div>

              <div>
                <label>Investment Date</label>
                <input
                  type="date"
                  value={investmentDate}
                  onChange={(e) => setInvestmentDate(e.target.value)}
                />
              </div>

              <div>
                <label>Maturity Date</label>
                <input
                  type="date"
                  value={maturityDate}
                  onChange={(e) => setMaturityDate(e.target.value)}
                />
              </div>
            </div>

            <div className="stats-grid" style={{ marginTop: 20 }}>
              <div className="stat-box">
                <div className="stat-label">Total Investment</div>
                <div className="stat-value">{formatCurrency(totalAmountNumber)}</div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Borrowed Amount</div>
                <div className="stat-value">{formatCurrency(borrowedAmountNumber)}</div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Self Invested</div>
                <div className="stat-value">{formatCurrency(selfInvestedAmount)}</div>
              </div>
            </div>

            <div className="investor-box">
              <div className="investor-head">
                <div>
                  <h3 style={{ margin: 0 }}>Borrowed Investors</h3>
                  <p className="section-text" style={{ margin: "6px 0 0" }}>
                    Only fill these if there is a borrowed amount.
                  </p>
                </div>

                <button
                  className="btn-light"
                  type="button"
                  onClick={addBorrowedInvestor}
                >
                  + Add Borrowed Investor
                </button>
              </div>

              {borrowedInvestors.map((item, index) => (
                <div className="investor-item" key={item.id}>
                  <div>
                    <label>Borrowed Investor Name</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) =>
                        handleBorrowedInvestorChange(item.id, "name", e.target.value)
                      }
                      placeholder={`Borrowed Investor ${index + 1}`}
                    />
                  </div>

                  <div>
                    <label>Amount</label>
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) =>
                        handleBorrowedInvestorChange(item.id, "amount", e.target.value)
                      }
                      placeholder="Amount"
                    />
                  </div>

                  <div>
                    <label>Total Borrowed Entered</label>
                    <input
                      type="text"
                      value={formatCurrency(borrowedInvestorTotal)}
                      readOnly
                    />
                  </div>

                  <div>
                    <label>Action</label>
                    <button
                      className="btn-light"
                      type="button"
                      onClick={() => removeBorrowedInvestor(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-label">Borrowed Investor Total</div>
                  <div className="stat-value">
                    {formatCurrency(borrowedInvestorTotal)}
                  </div>
                </div>

                <div className="stat-box">
                  <div className="stat-label">Borrowed Amount Target</div>
                  <div className="stat-value">
                    {formatCurrency(borrowedAmountNumber)}
                  </div>
                </div>
              </div>
            </div>

            {error && <div className="alert-error">{error}</div>}
            {success && <div className="alert-success">{success}</div>}

            <div className="btn-row" style={{ marginTop: 24 }}>
              <button className="btn-dark" type="button" onClick={saveInvestment}>
                {isEditingMain ? "Update Investment" : "Save Investment"}
              </button>

              <button className="btn-light" type="button" onClick={resetForm}>
                {isEditingMain ? "Cancel Edit" : "Clear Form"}
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">Dashboard</h2>

            <div className="grid">
              <div className="stat-box">
                <div className="stat-label">Original Investments Only</div>
                <div className="stat-value">{originalInvestments.length}</div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Portfolio Amount</div>
                <div className="stat-value">{formatCurrency(totalPortfolioAmount)}</div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Total Self Invested</div>
                <div className="stat-value">
                  {formatCurrency(totalSelfInvestedPortfolioAmount)}
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Total Borrowed</div>
                <div className="stat-value">
                  {formatCurrency(totalBorrowedPortfolioAmount)}
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-label">All Records</div>
                <div className="stat-value">{investments.length}</div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Active Records</div>
                <div className="stat-value">
                  {investments.filter((item) => item.status === "active").length}
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Matured Records</div>
                <div className="stat-value">
                  {investments.filter((item) => item.status === "matured").length}
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Reinvested Records</div>
                <div className="stat-value">
                  {investments.filter((item) => item.status === "reinvested").length}
                </div>
              </div>
            </div>

            <div className="btn-row" style={{ marginTop: 20 }}>
              <button className="btn-light" type="button" onClick={exportCsv}>
                Export CSV
              </button>
              <button className="btn-light" type="button" onClick={exportBackupJson}>
                Backup JSON
              </button>
              <button
                className="btn-light"
                type="button"
                onClick={resetAllData}
                style={{ borderColor: "#fecaca", color: "#b91c1c" }}
              >
                Reset All Data
              </button>
            </div>
          </div>
        </div>

        <div className="card list-card">
          <div className="list-head">
            <div>
              <h2 className="section-title" style={{ marginBottom: 4 }}>
                Investment List
              </h2>
              <p className="section-text" style={{ margin: 0 }}>
                Search, filter, edit, delete, and reinvest from here.
              </p>
            </div>
          </div>

          <div
            className="btn-row"
            style={{ marginBottom: 20, alignItems: "end", gap: 16 }}
          >
            <div style={{ minWidth: 260 }}>
              <label>Search</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search invoice or investment name"
              />
            </div>

            <div style={{ minWidth: 220 }}>
              <label>Status Filter</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="matured">Matured</option>
                <option value="reinvested">Reinvested</option>
              </select>
            </div>
          </div>

          {filteredInvestments.length === 0 ? (
            <div className="empty-box">No matching investments found</div>
          ) : (
            filteredInvestments.map((investment) => {
              const isSelected = investment.id === selectedInvestmentId;
              const reinvestmentStart = addDays(investment.maturityDate, 10);
              const isEditingDates = editModeId === investment.id;
              const showReinvestBox = showReinvestBoxId === investment.id;

              return (
                <div
                  key={investment.id}
                  className={`investment-item ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedInvestmentId(investment.id)}
                >
                  <div className="investment-top">
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0 }}>{investment.investmentName}</h3>

                      <div
                        style={{
                          ...getStatusStyle(investment.status),
                          display: "inline-block",
                          borderRadius: 999,
                          padding: "6px 12px",
                          fontSize: 12,
                          fontWeight: 700,
                          marginTop: 8,
                        }}
                      >
                        {investment.status}
                      </div>

                      <div style={{ marginTop: 14, marginBottom: 14 }}>
                        <strong>Invoice Number:</strong> {investment.invoiceNumber}
                      </div>

                      <div className="meta-grid">
                        <div>
                          <strong>Total Amount:</strong>{" "}
                          {formatCurrency(investment.totalAmount)}
                        </div>
                        <div>
                          <strong>Borrowed Amount:</strong>{" "}
                          {formatCurrency(investment.borrowedAmount)}
                        </div>
                        <div>
                          <strong>Self Invested:</strong>{" "}
                          {formatCurrency(investment.selfInvestedAmount)}
                        </div>
                        <div>
                          <strong>Investment Date:</strong>{" "}
                          {formatDisplayDate(investment.investmentDate)}
                        </div>
                        <div>
                          <strong>Maturity Date:</strong>{" "}
                          {formatDisplayDate(investment.maturityDate)}
                        </div>
                        <div>
                          <strong>Reinvestment Start:</strong>{" "}
                          {formatDisplayDate(reinvestmentStart)}
                        </div>
                      </div>

                      <div
                        className="btn-row"
                        style={{ marginTop: 16 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          className="btn-light"
                          type="button"
                          onClick={() => startEditInvestment(investment)}
                        >
                          Edit Investment
                        </button>

                        <button
                          className="btn-light"
                          type="button"
                          onClick={() => startEditDates(investment)}
                        >
                          Edit Maturity Date
                        </button>

                        <button
                          className="btn-dark"
                          type="button"
                          onClick={() => openReinvestBox(investment)}
                        >
                          Reinvest
                        </button>

                        <button
                          className="btn-light"
                          type="button"
                          onClick={() => markAsMatured(investment.id)}
                        >
                          Mark Matured
                        </button>

                        <button
                          className="btn-light"
                          type="button"
                          onClick={() => deleteInvestment(investment.id)}
                          style={{ borderColor: "#fecaca", color: "#b91c1c" }}
                        >
                          Delete
                        </button>
                      </div>

                      {isEditingDates && (
                        <div className="note-box" style={{ marginTop: 16 }}>
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              flexWrap: "wrap",
                              alignItems: "end",
                            }}
                          >
                            <div>
                              <label>Maturity Date</label>
                              <input
                                type="date"
                                value={editMaturityDate}
                                onChange={(e) => {
                                  const nextMaturity = e.target.value;
                                  setEditMaturityDate(nextMaturity);
                                  setEditReinvestmentDate(addDays(nextMaturity, 10));
                                }}
                                style={{ maxWidth: 220 }}
                              />
                            </div>

                            <div>
                              <label>Reinvestment Start (Preview)</label>
                              <input
                                type="date"
                                value={editReinvestmentDate}
                                style={{ maxWidth: 220 }}
                                readOnly
                              />
                            </div>

                            <button
                              className="btn-dark"
                              type="button"
                              onClick={() => saveEditDates(investment)}
                            >
                              Save Dates
                            </button>

                            <button
                              className="btn-light"
                              type="button"
                              onClick={cancelEditDates}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {showReinvestBox && (
                        <div className="note-box" style={{ marginTop: 16 }}>
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              flexWrap: "wrap",
                              alignItems: "end",
                            }}
                          >
                            <div>
                              <label>New Reinvestment Invoice No</label>
                              <input
                                type="text"
                                value={reinvestInvoiceNumber}
                                onChange={(e) =>
                                  setReinvestInvoiceNumber(e.target.value)
                                }
                                placeholder="Enter new invoice number"
                                style={{ maxWidth: 220 }}
                              />
                            </div>

                            <div>
                              <label>Reinvestment Date</label>
                              <input
                                type="date"
                                value={reinvestInvestmentDate}
                                onChange={(e) => {
                                  const nextDate = e.target.value;
                                  setReinvestInvestmentDate(nextDate);
                                  const previousTermDays = getDateDifferenceInDays(
                                    investment.investmentDate,
                                    investment.maturityDate
                                  );
                                  setReinvestMaturityDate(
                                    addDays(nextDate, previousTermDays)
                                  );
                                }}
                                style={{ maxWidth: 220 }}
                              />
                            </div>

                            <div>
                              <label>New Maturity Date</label>
                              <input
                                type="date"
                                value={reinvestMaturityDate}
                                onChange={(e) =>
                                  setReinvestMaturityDate(e.target.value)
                                }
                                style={{ maxWidth: 220 }}
                              />
                            </div>

                            <button
                              className="btn-dark"
                              type="button"
                              onClick={() => createReinvestment(investment)}
                            >
                              Create Reinvestment
                            </button>

                            <button
                              className="btn-light"
                              type="button"
                              onClick={cancelReinvestBox}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {investment.parentInvestmentId && (
                        <div className="note-box">
                          This is a reinvestment record
                        </div>
                      )}
                    </div>

                    <div className="investor-summary">
                      <strong>Borrowed Investors</strong>
                      <div style={{ marginTop: 12 }}>
                        {(investment.borrowedInvestors || []).length === 0 ? (
                          <div style={{ fontSize: 14, color: "#64748b" }}>
                            No borrowed investors
                          </div>
                        ) : (
                          investment.borrowedInvestors.map((item) => (
                            <div
                              key={item.id}
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                marginBottom: 10,
                                fontSize: 14,
                              }}
                            >
                              <div>
                                <strong>{item.name}</strong>
                              </div>
                              <div>{formatCurrency(item.amount)}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
