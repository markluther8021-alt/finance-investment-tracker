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
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
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
  return `LKR ${number.toLocaleString("en-LK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const getStatusBadgeStyle = (status) => {
  if (status === "active") {
    return {
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #86efac",
    };
  }

  if (status === "matured") {
    return {
      background: "#ffedd5",
      color: "#c2410c",
      border: "1px solid #fdba74",
    };
  }

  if (status === "reinvested") {
    return {
      background: "#e0e7ff",
      color: "#4338ca",
      border: "1px solid #a5b4fc",
    };
  }

  return {
    background: "#f1f5f9",
    color: "#475569",
    border: "1px solid #cbd5e1",
  };
};

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

  const [editModeId, setEditModeId] = useState("");
  const [editMaturityDate, setEditMaturityDate] = useState("");
  const [editReinvestmentDate, setEditReinvestmentDate] = useState("");

  const [showReinvestBoxId, setShowReinvestBoxId] = useState("");
  const [reinvestInvoiceNumber, setReinvestInvoiceNumber] = useState("");
  const [reinvestInvestmentDate, setReinvestInvestmentDate] = useState("");
  const [reinvestMaturityDate, setReinvestMaturityDate] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [editingInvestmentId, setEditingInvestmentId] = useState("");

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

  useEffect(() => {
    if (!editMaturityDate) {
      setEditReinvestmentDate("");
      return;
    }
    setEditReinvestmentDate(addDays(editMaturityDate, 10));
  }, [editMaturityDate]);

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

  const activeRunningInvestments = useMemo(() => {
    return investments.filter((item) => item.status === "active");
  }, [investments]);

  const maturedInvestments = useMemo(() => {
    return investments.filter((item) => item.status === "matured");
  }, [investments]);

  const reinvestedInvestments = useMemo(() => {
    return investments.filter((item) => item.status === "reinvested");
  }, [investments]);

  const currentRunningPortfolioAmount = useMemo(() => {
    return activeRunningInvestments.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0
    );
  }, [activeRunningInvestments]);

  const currentRunningBorrowedPortfolioAmount = useMemo(() => {
    return activeRunningInvestments.reduce(
      (sum, item) => sum + Number(item.borrowedAmount || 0),
      0
    );
  }, [activeRunningInvestments]);

  const currentRunningSelfInvestedPortfolioAmount = useMemo(() => {
    return activeRunningInvestments.reduce(
      (sum, item) => sum + Number(item.selfInvestedAmount || 0),
      0
    );
  }, [activeRunningInvestments]);

  const filteredInvestments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return investments;

    return investments.filter((item) => {
      const invoice = (item.invoiceNumber || "").toLowerCase();
      const name = (item.investmentName || "").toLowerCase();
      return invoice.includes(keyword) || name.includes(keyword);
    });
  }, [investments, searchTerm]);

  const getChildInvestment = (investmentId) => {
    return investments.find((item) => item.parentInvestmentId === investmentId) || null;
  };

  const canReinvest = (investment) => {
    if (!investment) return false;
    if (investment.status !== "matured") return false;
    if (getChildInvestment(investment.id)) return false;
    return true;
  };

  const getInvestmentChain = (investmentId) => {
    const current = investments.find((item) => item.id === investmentId);
    if (!current) return [];

    const parents = [];
    let pointer = current;

    while (pointer) {
      parents.unshift(pointer);
      pointer = pointer.parentInvestmentId
        ? investments.find((item) => item.id === pointer.parentInvestmentId) || null
        : null;
    }

    return parents;
  };

  const selectedInvestmentChain = useMemo(() => {
    if (!selectedInvestmentId) return [];
    return getInvestmentChain(selectedInvestmentId);
  }, [selectedInvestmentId, investments]);

  const rootInvestment = useMemo(() => {
    return selectedInvestmentChain.length > 0 ? selectedInvestmentChain[0] : null;
  }, [selectedInvestmentChain]);

  const resetForm = () => {
    setInvoiceNumber("");
    setInvestmentName("");
    setTotalAmount("");
    setBorrowedAmount("");
    setInvestmentDate("");
    setMaturityDate("");
    setBorrowedInvestors([createBorrowedInvestor()]);
    setEditingInvestmentId("");
  };

  const resetAllData = () => {
    const confirmed = window.confirm(
      "This will delete all saved investment data from this browser. Continue?"
    );

    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);
    setInvestments([]);
    setSelectedInvestmentId("");
    setSearchTerm("");
    resetForm();
    cancelEditDates();
    cancelReinvestBox();
    setSuccess("All local data has been reset");
    setError("");
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

  const clearMessages = () => {
    setError("");
    setSuccess("");
  };

  const validateForm = () => {
    if (!invoiceNumber.trim()) return "Invoice number is required";
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

    const duplicateInvoice = investments.find(
      (item) =>
        item.invoiceNumber.trim().toLowerCase() ===
          invoiceNumber.trim().toLowerCase() &&
        item.id !== editingInvestmentId
    );

    if (duplicateInvoice) {
      return "Invoice number already exists";
    }

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

    const preparedBorrowedInvestors =
      borrowedAmountNumber > 0
        ? borrowedInvestors.map((item) => ({
            ...item,
            id: item.id || generateId(),
            name: item.name.trim(),
            amount: Number(item.amount),
          }))
        : [];

    if (editingInvestmentId) {
      setInvestments((prev) =>
        prev.map((item) =>
          item.id === editingInvestmentId
            ? {
                ...item,
                invoiceNumber: invoiceNumber.trim(),
                investmentName: investmentName.trim(),
                totalAmount: totalAmountNumber,
                borrowedAmount: borrowedAmountNumber,
                selfInvestedAmount,
                investmentDate,
                maturityDate,
                borrowedInvestors: preparedBorrowedInvestors,
              }
            : item
        )
      );

      setSelectedInvestmentId(editingInvestmentId);
      resetForm();
      setSuccess("Investment updated successfully");
      setError("");
      return;
    }

    const newInvestment = {
      id: generateId(),
      invoiceNumber: invoiceNumber.trim(),
      investmentName: investmentName.trim(),
      totalAmount: totalAmountNumber,
      borrowedAmount: borrowedAmountNumber,
      selfInvestedAmount,
      investmentDate,
      maturityDate,
      borrowedInvestors: preparedBorrowedInvestors,
      status: "active",
      parentInvestmentId: null,
    };

    setInvestments((prev) => [newInvestment, ...prev]);
    setSelectedInvestmentId(newInvestment.id);
    resetForm();
    setSuccess("Investment saved successfully");
  };

  const editInvestment = (investment) => {
    clearMessages();
    cancelEditDates();
    cancelReinvestBox();

    setEditingInvestmentId(investment.id);
    setSelectedInvestmentId(investment.id);
    setInvoiceNumber(investment.invoiceNumber || "");
    setInvestmentName(investment.investmentName || "");
    setTotalAmount(String(investment.totalAmount ?? ""));
    setBorrowedAmount(String(investment.borrowedAmount ?? ""));
    setInvestmentDate(investment.investmentDate || "");
    setMaturityDate(investment.maturityDate || "");
    setBorrowedInvestors(
      investment.borrowedInvestors && investment.borrowedInvestors.length > 0
        ? investment.borrowedInvestors.map((item) => ({
            ...item,
            id: item.id || generateId(),
            amount: String(item.amount ?? ""),
          }))
        : [createBorrowedInvestor()]
    );
  };

  const deleteInvestment = (investmentId) => {
    const hasChildren = investments.some(
      (item) => item.parentInvestmentId === investmentId
    );

    const confirmed = window.confirm(
      hasChildren
        ? "This investment has reinvestment history. Delete it anyway?"
        : "Delete this investment?"
    );

    if (!confirmed) return;

    const idsToDelete = new Set();
    const collectIds = (id) => {
      idsToDelete.add(id);
      investments
        .filter((item) => item.parentInvestmentId === id)
        .forEach((child) => collectIds(child.id));
    };

    collectIds(investmentId);

    setInvestments((prev) => prev.filter((item) => !idsToDelete.has(item.id)));

    if (idsToDelete.has(selectedInvestmentId)) {
      setSelectedInvestmentId("");
    }

    if (idsToDelete.has(editingInvestmentId)) {
      resetForm();
    }

    cancelEditDates();
    cancelReinvestBox();
    setSuccess("Investment deleted successfully");
    setError("");
  };

  const markAsMatured = (investmentId) => {
    const target = investments.find((item) => item.id === investmentId);

    if (!target) {
      setError("Investment not found");
      return;
    }

    if (target.status !== "active") {
      setError("Only active investments can be marked as matured");
      return;
    }

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

    const child = getChildInvestment(investment.id);
    if (child) {
      const childStart = new Date(child.investmentDate);
      if (childStart <= maturity) {
        setError(
          "Maturity date cannot be on or after the next reinvestment date"
        );
        return;
      }
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
    setSuccess("Dates updated successfully");
    setError("");
  };

  const openReinvestBox = (investment) => {
    if (investment.status !== "matured") {
      setError("Reinvestment is allowed only after investment is matured");
      setSuccess("");
      return;
    }

    const child = getChildInvestment(investment.id);
    if (child) {
      setError("This invoice already has a reinvestment");
      setSuccess("");
      return;
    }

    setShowReinvestBoxId(investment.id);
    setReinvestInvoiceNumber("");
    const defaultInvestmentDate = addDays(investment.maturityDate, 10);
    setReinvestInvestmentDate(defaultInvestmentDate);
    setReinvestMaturityDate(defaultInvestmentDate);
    clearMessages();
  };

  const cancelReinvestBox = () => {
    setShowReinvestBoxId("");
    setReinvestInvoiceNumber("");
    setReinvestInvestmentDate("");
    setReinvestMaturityDate("");
  };

  const createReinvestment = (investment) => {
    if (investment.status !== "matured") {
      setError("Investment must be matured before reinvestment");
      return;
    }

    const child = getChildInvestment(investment.id);
    if (child) {
      setError("This invoice already has a reinvestment");
      return;
    }

    if (!reinvestInvoiceNumber.trim()) {
      setError("New reinvestment invoice number is required");
      return;
    }

    const duplicateInvoice = investments.find(
      (item) =>
        item.invoiceNumber.trim().toLowerCase() ===
        reinvestInvoiceNumber.trim().toLowerCase()
    );

    if (duplicateInvoice) {
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

    const parentMaturity = new Date(investment.maturityDate);
    const reinvestStart = new Date(reinvestInvestmentDate);
    const reinvestEnd = new Date(reinvestMaturityDate);

    if (reinvestStart <= parentMaturity) {
      setError("Reinvestment date must be after parent maturity date");
      return;
    }

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
              {editingInvestmentId ? "Edit Investment" : "Add New Investment"}
            </h2>
            <p className="section-text">
              Total investment, borrowed amount, self-invested amount, invoice
              number, and dates.
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
                <div className="stat-value">
                  {formatCurrency(totalAmountNumber)}
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Borrowed Amount</div>
                <div className="stat-value">
                  {formatCurrency(borrowedAmountNumber)}
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Self Invested</div>
                <div className="stat-value">
                  {formatCurrency(selfInvestedAmount)}
                </div>
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
                        handleBorrowedInvestorChange(
                          item.id,
                          "name",
                          e.target.value
                        )
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
                        handleBorrowedInvestorChange(
                          item.id,
                          "amount",
                          e.target.value
                        )
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
                {editingInvestmentId ? "Update Investment" : "Save Investment"}
              </button>
              <button className="btn-light" type="button" onClick={resetForm}>
                {editingInvestmentId ? "Cancel Edit" : "Clear Form"}
              </button>
            </div>
          </div>

          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                Dashboard
              </h2>

              <button className="btn-light" type="button" onClick={resetAllData}>
                Reset All Data
              </button>
            </div>

            <div className="grid">
              <div className="stat-box">
                <div className="stat-label">Current Running Investments</div>
                <div className="stat-value">{activeRunningInvestments.length}</div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Running Portfolio Amount</div>
                <div className="stat-value">
                  {formatCurrency(currentRunningPortfolioAmount)}
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Running Self Invested</div>
                <div className="stat-value">
                  {formatCurrency(currentRunningSelfInvestedPortfolioAmount)}
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Running Borrowed</div>
                <div className="stat-value">
                  {formatCurrency(currentRunningBorrowedPortfolioAmount)}
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Active</div>
                <div className="stat-value">{activeRunningInvestments.length}</div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Matured</div>
                <div className="stat-value">{maturedInvestments.length}</div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Reinvested</div>
                <div className="stat-value">{reinvestedInvestments.length}</div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Total Records</div>
                <div className="stat-value">{investments.length}</div>
              </div>
            </div>

            {selectedInvestment && (
              <div className="note-box" style={{ marginTop: 16 }}>
                <strong>Selected Investment Summary</strong>
                <div className="meta-grid" style={{ marginTop: 12 }}>
                  <div>
                    <strong>Current Invoice:</strong> {selectedInvestment.invoiceNumber}
                  </div>
                  <div>
                    <strong>Root Invoice:</strong>{" "}
                    {rootInvestment ? rootInvestment.invoiceNumber : "-"}
                  </div>
                  <div>
                    <strong>Initial Investment Date:</strong>{" "}
                    {rootInvestment
                      ? formatDisplayDate(rootInvestment.investmentDate)
                      : "-"}
                  </div>
                  <div>
                    <strong>Current Status:</strong> {selectedInvestment.status}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <strong>Previous Invoice Chain</strong>
                  <div style={{ marginTop: 8, fontSize: 14, color: "#334155" }}>
                    {selectedInvestmentChain.length === 0
                      ? "No history"
                      : selectedInvestmentChain
                          .map((item) => item.invoiceNumber)
                          .join(" → ")}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card list-card">
          <div className="list-head">
            <div>
              <h2 className="section-title" style={{ marginBottom: 4 }}>
                Investment List
              </h2>
              <p className="section-text" style={{ margin: 0 }}>
                Data auto-saves after every change.
              </p>
            </div>

            {selectedInvestment && selectedInvestment.status === "active" && (
              <div className="btn-row">
                <button
                  className="btn-light"
                  type="button"
                  onClick={() => markAsMatured(selectedInvestment.id)}
                >
                  Mark as Matured
                </button>
              </div>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by invoice or investment name"
            />
          </div>

          {filteredInvestments.length === 0 ? (
            <div className="empty-box">
              {searchTerm
                ? "No matching investments found"
                : "No investments added yet"}
            </div>
          ) : (
            filteredInvestments.map((investment) => {
              const isSelected = investment.id === selectedInvestmentId;
              const reinvestmentStart = addDays(investment.maturityDate, 10);
              const isEditingDates = editModeId === investment.id;
              const showReinvestBox = showReinvestBoxId === investment.id;
              const badgeStyle = getStatusBadgeStyle(investment.status);
              const childInvestment = getChildInvestment(investment.id);
              const investmentChain = getInvestmentChain(investment.id);

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
                        className="badge"
                        style={{
                          background: badgeStyle.background,
                          color: badgeStyle.color,
                          border: badgeStyle.border,
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
                          onClick={() => editInvestment(investment)}
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

                        {investment.status === "active" && (
                          <button
                            className="btn-light"
                            type="button"
                            onClick={() => markAsMatured(investment.id)}
                          >
                            Matured
                          </button>
                        )}

                        {canReinvest(investment) && (
                          <button
                            className="btn-dark"
                            type="button"
                            onClick={() => openReinvestBox(investment)}
                          >
                            Reinvest
                          </button>
                        )}

                        <button
                          className="btn-light"
                          type="button"
                          onClick={() => deleteInvestment(investment.id)}
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
                                onChange={(e) => setEditMaturityDate(e.target.value)}
                                style={{ maxWidth: 220 }}
                              />
                            </div>

                            <div>
                              <label>Reinvestment Start (Preview)</label>
                              <input
                                type="date"
                                value={editReinvestmentDate}
                                onChange={(e) =>
                                  setEditReinvestmentDate(e.target.value)
                                }
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
                                onChange={(e) =>
                                  setReinvestInvestmentDate(e.target.value)
                                }
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

                      <div className="note-box" style={{ marginTop: 16 }}>
                        <strong>Investment History</strong>
                        <div style={{ marginTop: 10, fontSize: 14, color: "#334155" }}>
                          <div>
                            <strong>Invoice Chain:</strong>{" "}
                            {investmentChain.map((item) => item.invoiceNumber).join(" → ")}
                          </div>
                          <div style={{ marginTop: 6 }}>
                            <strong>Initial Investment Date:</strong>{" "}
                            {investmentChain.length > 0
                              ? formatDisplayDate(investmentChain[0].investmentDate)
                              : "-"}
                          </div>
                          {childInvestment && (
                            <div style={{ marginTop: 6 }}>
                              <strong>Next Reinvestment Invoice:</strong>{" "}
                              {childInvestment.invoiceNumber}
                            </div>
                          )}
                        </div>
                      </div>

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
