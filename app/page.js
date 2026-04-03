"use client";

import { useMemo, useState } from "react";

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

const createEmptyInvestor = () => ({
  id: generateId(),
  name: "",
  amount: "",
  type: "own",
});

export default function Page() {
  const [investments, setInvestments] = useState([]);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState("");
  const [investmentName, setInvestmentName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [investmentDate, setInvestmentDate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");
  const [investors, setInvestors] = useState([createEmptyInvestor()]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const investorTotal = useMemo(() => {
    return investors.reduce((sum, investor) => sum + Number(investor.amount || 0), 0);
  }, [investors]);

  const borrowedTotal = useMemo(() => {
    return investors
      .filter((investor) => investor.type === "borrowed")
      .reduce((sum, investor) => sum + Number(investor.amount || 0), 0);
  }, [investors]);

  const selectedInvestment = useMemo(() => {
    return investments.find((item) => item.id === selectedInvestmentId) || null;
  }, [investments, selectedInvestmentId]);

  const totalPortfolioAmount = useMemo(() => {
    return investments.reduce((sum, item) => sum + Number(item.totalAmount || 0), 0);
  }, [investments]);

  const resetForm = () => {
    setInvestmentName("");
    setTotalAmount("");
    setInvestmentDate("");
    setMaturityDate("");
    setInvestors([createEmptyInvestor()]);
  };

  const handleInvestorChange = (id, field, value) => {
    setInvestors((prev) =>
      prev.map((investor) =>
        investor.id === id ? { ...investor, [field]: value } : investor
      )
    );
  };

  const addInvestor = () => {
    setInvestors((prev) => [...prev, createEmptyInvestor()]);
  };

  const removeInvestor = (id) => {
    setInvestors((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((investor) => investor.id !== id);
    });
  };

  const validateForm = () => {
    if (!investmentName.trim()) return "Investment name is required";
    if (!totalAmount || Number(totalAmount) <= 0) {
      return "Total investment amount must be greater than 0";
    }
    if (!investmentDate) return "Investment date is required";
    if (!maturityDate) return "Maturity date is required";

    const start = new Date(investmentDate);
    const end = new Date(maturityDate);

    if (end < start) return "Maturity date cannot be before investment date";

    const hasInvalidInvestor = investors.some(
      (investor) =>
        !investor.name.trim() || !investor.amount || Number(investor.amount) <= 0
    );

    if (hasInvalidInvestor) {
      return "Each investor must have a name and amount greater than 0";
    }

    if (investorTotal !== Number(totalAmount)) {
      return `Investor total (${investorTotal}) must equal total investment (${Number(totalAmount)})`;
    }

    if (borrowedTotal > Number(totalAmount)) {
      return "Borrowed amount cannot exceed total investment";
    }

    return "";
  };

  const saveInvestment = () => {
    setError("");
    setSuccess("");

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const newInvestment = {
      id: generateId(),
      investmentName: investmentName.trim(),
      totalAmount: Number(totalAmount),
      investmentDate,
      maturityDate,
      investors: investors.map((investor) => ({
        ...investor,
        name: investor.name.trim(),
        amount: Number(investor.amount),
      })),
      status: "active",
      parentInvestmentId: null,
    };

    setInvestments((prev) => [newInvestment, ...prev]);
    setSelectedInvestmentId(newInvestment.id);
    resetForm();
    setSuccess("Investment saved successfully");
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

  const reinvestSelected = () => {
    if (!selectedInvestment) return;

    const nextInvestmentDate = addDays(selectedInvestment.maturityDate, 10);

    const reinvestment = {
      id: generateId(),
      investmentName: `${selectedInvestment.investmentName} - Reinvestment`,
      totalAmount: selectedInvestment.totalAmount,
      investmentDate: nextInvestmentDate,
      maturityDate: selectedInvestment.maturityDate,
      investors: selectedInvestment.investors.map((investor) => ({
        ...investor,
        id: generateId(),
      })),
      status: "active",
      parentInvestmentId: selectedInvestment.id,
    };

    setInvestments((prev) => {
      const updated = prev.map((item) =>
        item.id === selectedInvestment.id ? { ...item, status: "reinvested" } : item
      );
      return [reinvestment, ...updated];
    });

    setSelectedInvestmentId(reinvestment.id);
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
            <h2 className="section-title">Add New Investment</h2>
            <p className="section-text">
              Add investment details, investors, borrowed amount, and dates.
            </p>

            <div className="form-grid">
              <div className="full-width">
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

            <div className="investor-box">
              <div className="investor-head">
                <div>
                  <h3 style={{ margin: 0 }}>Investors</h3>
                  <p className="section-text" style={{ margin: "6px 0 0" }}>
                    Add own or borrowed investors inside the investment form.
                  </p>
                </div>

                <button className="btn-light" type="button" onClick={addInvestor}>
                  + Add Investor
                </button>
              </div>

              {investors.map((investor, index) => (
                <div className="investor-item" key={investor.id}>
                  <div>
                    <label>Investor Name</label>
                    <input
                      type="text"
                      value={investor.name}
                      onChange={(e) =>
                        handleInvestorChange(investor.id, "name", e.target.value)
                      }
                      placeholder={`Investor ${index + 1}`}
                    />
                  </div>

                  <div>
                    <label>Amount</label>
                    <input
                      type="number"
                      value={investor.amount}
                      onChange={(e) =>
                        handleInvestorChange(investor.id, "amount", e.target.value)
                      }
                      placeholder="Amount"
                    />
                  </div>

                  <div>
                    <label>Type</label>
                    <select
                      value={investor.type}
                      onChange={(e) =>
                        handleInvestorChange(investor.id, "type", e.target.value)
                      }
                    >
                      <option value="own">Own</option>
                      <option value="borrowed">Borrowed</option>
                    </select>
                  </div>

                  <div>
                    <label>Action</label>
                    <button
                      className="btn-light"
                      type="button"
                      onClick={() => removeInvestor(investor.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}

              <div className="stats-grid">
                <div className="stat-box">
                  <div className="stat-label">Total from Investors</div>
                  <div className="stat-value">{investorTotal}</div>
                </div>

                <div className="stat-box">
                  <div className="stat-label">Borrowed Amount</div>
                  <div className="stat-value">{borrowedTotal}</div>
                </div>
              </div>
            </div>

            {error && <div className="alert-error">{error}</div>}
            {success && <div className="alert-success">{success}</div>}

            <div className="btn-row" style={{ marginTop: 24 }}>
              <button className="btn-dark" type="button" onClick={saveInvestment}>
                Save Investment
              </button>
              <button className="btn-light" type="button" onClick={resetForm}>
                Clear Form
              </button>
            </div>
          </div>

          <div className="card">
            <h2 className="section-title">Dashboard</h2>

            <div className="grid">
              <div className="stat-box">
                <div className="stat-label">Total Investments</div>
                <div className="stat-value">{investments.length}</div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Portfolio Amount</div>
                <div className="stat-value">{totalPortfolioAmount}</div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Active</div>
                <div className="stat-value">
                  {investments.filter((item) => item.status === "active").length}
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Matured</div>
                <div className="stat-value">
                  {investments.filter((item) => item.status === "matured").length}
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-label">Reinvested</div>
                <div className="stat-value">
                  {investments.filter((item) => item.status === "reinvested").length}
                </div>
              </div>
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
                Select one investment to view and create reinvestment.
              </p>
            </div>

            {selectedInvestment && (
              <div className="btn-row">
                <button
                  className="btn-light"
                  type="button"
                  onClick={() => markAsMatured(selectedInvestment.id)}
                >
                  Mark as Matured
                </button>
                <button className="btn-dark" type="button" onClick={reinvestSelected}>
                  Reinvest (+10 days)
                </button>
              </div>
            )}
          </div>

          {investments.length === 0 ? (
            <div className="empty-box">No investments added yet</div>
          ) : (
            investments.map((investment) => {
              const isSelected = investment.id === selectedInvestmentId;
              const reinvestmentStart = addDays(investment.maturityDate, 10);

              return (
                <div
                  key={investment.id}
                  className={`investment-item ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedInvestmentId(investment.id)}
                >
                  <div className="investment-top">
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0 }}>{investment.investmentName}</h3>
                      <div className="badge">{investment.status}</div>

                      <div className="meta-grid">
                        <div>
                          <strong>Total Amount:</strong> {investment.totalAmount}
                        </div>
                        <div>
                          <strong>Investment Date:</strong> {investment.investmentDate}
                        </div>
                        <div>
                          <strong>Maturity Date:</strong> {investment.maturityDate}
                        </div>
                        <div>
                          <strong>Reinvestment Start:</strong> {reinvestmentStart}
                        </div>
                      </div>

                      {investment.parentInvestmentId && (
                        <div className="note-box">This is a reinvestment record</div>
                      )}
                    </div>

                    <div className="investor-summary">
                      <strong>Investors</strong>
                      <div style={{ marginTop: 12 }}>
                        {investment.investors.map((investor) => (
                          <div
                            key={investor.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              gap: 12,
                              marginBottom: 10,
                              fontSize: 14,
                            }}
                          >
                            <div>
                              <strong>{investor.name}</strong> ({investor.type})
                            </div>
                            <div>{investor.amount}</div>
                          </div>
                        ))}
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
