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
      background: "rgba(34, 197, 94, 0.12)",
      color: "#86efac",
      border: "1px solid rgba(34, 197, 94, 0.35)",
    };
  }

  if (status === "matured") {
    return {
      background: "rgba(249, 115, 22, 0.12)",
      color: "#fdba74",
      border: "1px solid rgba(249, 115, 22, 0.35)",
    };
  }

  if (status === "reinvested") {
    return {
      background: "rgba(99, 102, 241, 0.12)",
      color: "#a5b4fc",
      border: "1px solid rgba(99, 102, 241, 0.35)",
    };
  }

  if (status === "merged") {
    return {
      background: "rgba(168, 85, 247, 0.12)",
      color: "#d8b4fe",
      border: "1px solid rgba(168, 85, 247, 0.35)",
    };
  }

  return {
    background: "rgba(148, 163, 184, 0.12)",
    color: "#cbd5e1",
    border: "1px solid rgba(148, 163, 184, 0.35)",
  };
};

const createBorrowedInvestor = () => ({
  id: generateId(),
  name: "",
  amount: "",
});

const combineBorrowedInvestors = (borrowedInvestorGroups) => {
  const map = new Map();

  borrowedInvestorGroups.forEach((group) => {
    (group || []).forEach((item) => {
      const name = (item.name || "").trim();
      const amount = Number(item.amount || 0);
      if (!name || amount <= 0) return;

      const key = name.toLowerCase();
      const current = map.get(key);

      if (current) {
        current.amount += amount;
      } else {
        map.set(key, {
          id: generateId(),
          name,
          amount,
        });
      }
    });
  });

  return Array.from(map.values());
};

export default function Page() {
  const [activeTab, setActiveTab] = useState("investment");

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

  const [mergeSelectionIds, setMergeSelectionIds] = useState([]);
  const [mergeInvoiceNumber, setMergeInvoiceNumber] = useState("");
  const [mergeInvestmentDate, setMergeInvestmentDate] = useState("");
  const [mergeMaturityDate, setMergeMaturityDate] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [investorSearchTerm, setInvestorSearchTerm] = useState("");
  const [reportSearchTerm, setReportSearchTerm] = useState("");
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

  const mergedInvestments = useMemo(() => {
    return investments.filter((item) => item.status === "merged");
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

  const getChildInvestment = (investmentId) => {
    return (
      investments.find((item) => item.parentInvestmentId === investmentId) ||
      null
    );
  };

  const getMergeChildInvestment = (investmentId) => {
    return (
      investments.find(
        (item) =>
          Array.isArray(item.mergeSourceInvestmentIds) &&
          item.mergeSourceInvestmentIds.includes(investmentId)
      ) || null
    );
  };

  const canReinvest = (investment) => {
    if (!investment) return false;
    if (investment.status !== "matured") return false;
    if (getChildInvestment(investment.id)) return false;
    if (getMergeChildInvestment(investment.id)) return false;
    return true;
  };

  const canUseForMerge = (investment) => {
    if (!investment) return false;
    if (investment.status !== "matured") return false;
    if (getChildInvestment(investment.id)) return false;
    if (getMergeChildInvestment(investment.id)) return false;
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
        ? investments.find((item) => item.id === pointer.parentInvestmentId) ||
          null
        : null;
    }

    return parents;
  };

  const getChainChildren = (rootId) => {
    const chain = [];
    let current = investments.find((item) => item.id === rootId) || null;

    while (current) {
      chain.push(current);
      current =
        investments.find((item) => item.parentInvestmentId === current.id) ||
        null;
    }

    return chain;
  };

  const selectedInvestmentChain = useMemo(() => {
    if (!selectedInvestmentId) return [];
    return getInvestmentChain(selectedInvestmentId);
  }, [selectedInvestmentId, investments]);

  const rootInvestment = useMemo(() => {
    return selectedInvestmentChain.length > 0 ? selectedInvestmentChain[0] : null;
  }, [selectedInvestmentChain]);

  const currentInvestorBaseInvestments = useMemo(() => {
    return investments.filter(
      (item) => item.status === "active" || item.status === "matured"
    );
  }, [investments]);

  const existingInvestorNames = useMemo(() => {
    const names = new Map();

    investments.forEach((investment) => {
      (investment.borrowedInvestors || []).forEach((item) => {
        const name = (item.name || "").trim();
        if (!name) return;
        const key = name.toLowerCase();
        if (!names.has(key)) {
          names.set(key, name);
        }
      });
    });

    return Array.from(names.values()).sort((a, b) => a.localeCompare(b));
  }, [investments]);

  const investorSummaryRows = useMemo(() => {
    const map = new Map();

    currentInvestorBaseInvestments.forEach((investment) => {
      (investment.borrowedInvestors || []).forEach((item) => {
        const name = (item.name || "").trim();
        const amount = Number(item.amount || 0);
        if (!name || amount <= 0) return;

        const key = name.toLowerCase();
        const current = map.get(key) || {
          id: key,
          name,
          totalAmount: 0,
          investmentCount: 0,
          invoiceNumbers: [],
        };

        current.totalAmount += amount;
        current.investmentCount += 1;
        current.invoiceNumbers.push(investment.invoiceNumber);

        map.set(key, current);
      });
    });

    return Array.from(map.values())
      .map((item) => ({
        ...item,
        invoiceNumbers: Array.from(new Set(item.invoiceNumbers)),
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }, [currentInvestorBaseInvestments]);

  const filteredInvestorSummaryRows = useMemo(() => {
    const keyword = investorSearchTerm.trim().toLowerCase();
    if (!keyword) return investorSummaryRows;

    return investorSummaryRows.filter((item) =>
      item.name.toLowerCase().includes(keyword)
    );
  }, [investorSummaryRows, investorSearchTerm]);

  const filteredInvestments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    const visibleItems = investments.filter(
      (item) => item.status !== "reinvested" && item.status !== "merged"
    );

    if (!keyword) return visibleItems;

    return visibleItems.filter((item) => {
      const invoice = (item.invoiceNumber || "").toLowerCase();
      const name = (item.investmentName || "").toLowerCase();
      return invoice.includes(keyword) || name.includes(keyword);
    });
  }, [investments, searchTerm]);

  const mergeCandidates = useMemo(() => {
    return investments.filter((item) => canUseForMerge(item));
  }, [investments]);

  const selectedMergeInvestments = useMemo(() => {
    return mergeSelectionIds
      .map((id) => investments.find((item) => item.id === id))
      .filter(Boolean);
  }, [mergeSelectionIds, investments]);

  const selectedMergeTotalAmount = useMemo(() => {
    return selectedMergeInvestments.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0
    );
  }, [selectedMergeInvestments]);

  const selectedMergeBorrowedAmount = useMemo(() => {
    return selectedMergeInvestments.reduce(
      (sum, item) => sum + Number(item.borrowedAmount || 0),
      0
    );
  }, [selectedMergeInvestments]);

  const selectedMergeSelfAmount = useMemo(() => {
    return selectedMergeInvestments.reduce(
      (sum, item) => sum + Number(item.selfInvestedAmount || 0),
      0
    );
  }, [selectedMergeInvestments]);

  const reportRecords = useMemo(() => {
    const keyword = reportSearchTerm.trim().toLowerCase();

    const base = investments.filter(
      (item) =>
        item.status === "reinvested" ||
        item.status === "merged" ||
        (item.parentInvestmentId && item.status === "active") ||
        (Array.isArray(item.mergeSourceInvestmentIds) &&
          item.mergeSourceInvestmentIds.length > 0)
    );

    const unique = [];
    const seen = new Set();

    base.forEach((item) => {
      if (seen.has(item.id)) return;
      seen.add(item.id);
      unique.push(item);
    });

    unique.sort((a, b) => {
      const aDate = new Date(a.investmentDate || 0).getTime();
      const bDate = new Date(b.investmentDate || 0).getTime();
      return bDate - aDate;
    });

    if (!keyword) return unique;

    return unique.filter((item) => {
      const invoice = (item.invoiceNumber || "").toLowerCase();
      const name = (item.investmentName || "").toLowerCase();
      return invoice.includes(keyword) || name.includes(keyword);
    });
  }, [investments, reportSearchTerm]);

  const reinvestmentFlowReports = useMemo(() => {
    const keyword = reportSearchTerm.trim().toLowerCase();

    const rootItems = investments.filter((item) => {
      if (item.parentInvestmentId) return false;
      const child = investments.find(
        (childItem) => childItem.parentInvestmentId === item.id
      );
      return Boolean(child);
    });

    const flows = rootItems
      .map((root) => {
        const chain = getChainChildren(root.id);
        if (chain.length < 2) return null;

        const latest = chain[chain.length - 1];
        return {
          id: root.id,
          root,
          latest,
          chain,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const aDate = new Date(a.latest?.investmentDate || 0).getTime();
        const bDate = new Date(b.latest?.investmentDate || 0).getTime();
        return bDate - aDate;
      });

    if (!keyword) return flows;

    return flows.filter((flow) => {
      const chainInvoices = flow.chain.map((item) => item.invoiceNumber).join(" ");
      const chainNames = flow.chain.map((item) => item.investmentName).join(" ");
      return (
        chainInvoices.toLowerCase().includes(keyword) ||
        chainNames.toLowerCase().includes(keyword)
      );
    });
  }, [investments, reportSearchTerm]);

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

  const resetMergeForm = () => {
    setMergeSelectionIds([]);
    setMergeInvoiceNumber("");
    setMergeInvestmentDate("");
    setMergeMaturityDate("");
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
    setInvestorSearchTerm("");
    setReportSearchTerm("");
    resetForm();
    resetMergeForm();
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
      mergeSourceInvestmentIds: [],
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
    const hasChildren =
      investments.some((item) => item.parentInvestmentId === investmentId) ||
      investments.some(
        (item) =>
          Array.isArray(item.mergeSourceInvestmentIds) &&
          item.mergeSourceInvestmentIds.includes(investmentId)
      );

    const confirmed = window.confirm(
      hasChildren
        ? "This investment has reinvestment or merge history. Delete it anyway?"
        : "Delete this investment?"
    );

    if (!confirmed) return;

    const idsToDelete = new Set();
    const collectIds = (id) => {
      idsToDelete.add(id);

      investments
        .filter((item) => item.parentInvestmentId === id)
        .forEach((child) => collectIds(child.id));

      investments
        .filter(
          (item) =>
            Array.isArray(item.mergeSourceInvestmentIds) &&
            item.mergeSourceInvestmentIds.includes(id)
        )
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

    setMergeSelectionIds((prev) => prev.filter((id) => !idsToDelete.has(id)));

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

    const mergeChild = getMergeChildInvestment(investment.id);
    if (mergeChild) {
      const mergeStart = new Date(mergeChild.investmentDate);
      if (mergeStart <= maturity) {
        setError("Maturity date cannot be on or after the merge date");
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

    if (getMergeChildInvestment(investment.id)) {
      setError("This invoice is already used in a merged investment");
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

    if (getMergeChildInvestment(investment.id)) {
      setError("This invoice is already used in a merged investment");
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
      investmentName: `${investment.investmentName} (Reinvested)`,
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
      mergeSourceInvestmentIds: [],
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

  const toggleMergeSelection = (investmentId) => {
    setMergeSelectionIds((prev) => {
      if (prev.includes(investmentId)) {
        return prev.filter((id) => id !== investmentId);
      }
      return [...prev, investmentId];
    });
  };

  const createMergedInvestment = () => {
    clearMessages();

    if (mergeSelectionIds.length < 2) {
      setError("Select at least 2 matured invoices to merge");
      return;
    }

    if (!mergeInvoiceNumber.trim()) {
      setError("Merged invoice number is required");
      return;
    }

    const duplicateInvoice = investments.find(
      (item) =>
        item.invoiceNumber.trim().toLowerCase() ===
        mergeInvoiceNumber.trim().toLowerCase()
    );

    if (duplicateInvoice) {
      setError("Invoice number already exists");
      return;
    }

    if (!mergeInvestmentDate) {
      setError("Merged investment date is required");
      return;
    }

    if (!mergeMaturityDate) {
      setError("Merged maturity date is required");
      return;
    }

    const selectedItems = mergeSelectionIds
      .map((id) => investments.find((item) => item.id === id))
      .filter(Boolean);

    if (selectedItems.length !== mergeSelectionIds.length) {
      setError("Some selected investments were not found");
      return;
    }

    const invalidItem = selectedItems.find((item) => !canUseForMerge(item));
    if (invalidItem) {
      setError("Only matured invoices without reinvestment or merge can be merged");
      return;
    }

    const latestMaturityDate = selectedItems.reduce((latest, item) => {
      if (!latest) return item.maturityDate;
      return new Date(item.maturityDate) > new Date(latest)
        ? item.maturityDate
        : latest;
    }, "");

    const mergedStart = new Date(mergeInvestmentDate);
    const latestMaturity = new Date(latestMaturityDate);
    const mergedMaturity = new Date(mergeMaturityDate);

    if (mergedStart <= latestMaturity) {
      setError("Merged investment date must be after the latest source maturity date");
      return;
    }

    if (mergedMaturity < mergedStart) {
      setError("Merged maturity date cannot be before merged investment date");
      return;
    }

    const combinedBorrowedInvestors = combineBorrowedInvestors(
      selectedItems.map((item) => item.borrowedInvestors || [])
    );

    const mergedBorrowedAmount = combinedBorrowedInvestors.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    const mergedTotalAmount = selectedItems.reduce(
      (sum, item) => sum + Number(item.totalAmount || 0),
      0
    );

    const mergedSelfInvestedAmount = mergedTotalAmount - mergedBorrowedAmount;

    const mergedInvestment = {
      id: generateId(),
      invoiceNumber: mergeInvoiceNumber.trim(),
      investmentName: selectedItems.map((item) => item.invoiceNumber).join(" + "),
      totalAmount: mergedTotalAmount,
      borrowedAmount: mergedBorrowedAmount,
      selfInvestedAmount:
        mergedSelfInvestedAmount >= 0 ? mergedSelfInvestedAmount : 0,
      investmentDate: mergeInvestmentDate,
      maturityDate: mergeMaturityDate,
      borrowedInvestors: combinedBorrowedInvestors,
      status: "active",
      parentInvestmentId: null,
      mergeSourceInvestmentIds: selectedItems.map((item) => item.id),
    };

    setInvestments((prev) => {
      const updated = prev.map((item) =>
        mergeSelectionIds.includes(item.id) ? { ...item, status: "merged" } : item
      );
      return [mergedInvestment, ...updated];
    });

    setSelectedInvestmentId(mergedInvestment.id);
    resetMergeForm();
    setSuccess("Merged investment created successfully");
    setError("");
  };

  const renderTabButton = (tabId, label) => {
    const isActive = activeTab === tabId;

    return (
      <button
        type="button"
        onClick={() => setActiveTab(tabId)}
        className={isActive ? "btn-dark" : "btn-light"}
        style={{ minWidth: 130 }}
      >
        {label}
      </button>
    );
  };

  return (
    <main className="page">
      <div className="bg-orb orb-1" />
      <div className="bg-orb orb-2" />
      <div className="bg-orb orb-3" />

      <div className="container">
        <div className="card hero-card">
          <div className="hero-top">
            <div>
              <div className="eyebrow">Premium Finance Workspace</div>
              <h1 className="header-title">Finance Investment Tracker</h1>
              <p className="header-subtitle">Module 1 - Investment Management</p>
            </div>
          </div>

          <div
            className="btn-row"
            style={{
              marginTop: 24,
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            {renderTabButton("investment", "Investment")}
            {renderTabButton("investors", "Investors")}
            {renderTabButton("merge", "Merge")}
            {renderTabButton("reports", "Reports")}
          </div>
        </div>

        {activeTab === "investment" && (
          <>
            <div className="stats-grid dashboard-top" style={{ marginTop: 24 }}>
              <div className="stat-box premium">
                <div className="stat-label">Running Investments</div>
                <div className="stat-value">{activeRunningInvestments.length}</div>
              </div>
              <div className="stat-box premium">
                <div className="stat-label">Portfolio Amount</div>
                <div className="stat-value">
                  {formatCurrency(currentRunningPortfolioAmount)}
                </div>
              </div>
              <div className="stat-box premium">
                <div className="stat-label">Running Borrowed</div>
                <div className="stat-value">
                  {formatCurrency(currentRunningBorrowedPortfolioAmount)}
                </div>
              </div>
              <div className="stat-box premium">
                <div className="stat-label">Running Self Invested</div>
                <div className="stat-value">
                  {formatCurrency(currentRunningSelfInvestedPortfolioAmount)}
                </div>
              </div>
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
                      <h3 style={{ margin: 0, color: "#f8fafc" }}>Borrowed Investors</h3>
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
                          list="borrowed-investor-suggestions"
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
                          className="btn-light full-width-btn"
                          type="button"
                          onClick={() => removeBorrowedInvestor(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  <datalist id="borrowed-investor-suggestions">
                    {existingInvestorNames.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>

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
                <div className="card-head">
                  <h2 className="section-title" style={{ marginBottom: 0 }}>
                    Dashboard
                  </h2>

                  <button
                    className="btn-light"
                    type="button"
                    onClick={resetAllData}
                  >
                    Reset All Data
                  </button>
                </div>

                <div className="grid">
                  <div className="stat-box">
                    <div className="stat-label">Current Running Investments</div>
                    <div className="stat-value">
                      {activeRunningInvestments.length}
                    </div>
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
                    <div className="stat-value">
                      {activeRunningInvestments.length}
                    </div>
                  </div>

                  <div className="stat-box">
                    <div className="stat-label">Matured</div>
                    <div className="stat-value">{maturedInvestments.length}</div>
                  </div>

                  <div className="stat-box">
                    <div className="stat-label">Reinvested</div>
                    <div className="stat-value">
                      {reinvestedInvestments.length}
                    </div>
                  </div>

                  <div className="stat-box">
                    <div className="stat-label">Merged</div>
                    <div className="stat-value">{mergedInvestments.length}</div>
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
                        <strong>Current Invoice:</strong>{" "}
                        {selectedInvestment.invoiceNumber}
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
                        <strong>Current Status:</strong>{" "}
                        {selectedInvestment.status}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card list-card" style={{ marginTop: 24 }}>
              <div className="list-head">
                <div>
                  <h2 className="section-title" style={{ marginBottom: 4 }}>
                    Investment List
                  </h2>
                  <p className="section-text" style={{ margin: 0 }}>
                    Reinvested and merged previous invoices are hidden here. They
                    are shown in Report Module.
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
                    : "No active or matured investments to show"}
                </div>
              ) : (
                filteredInvestments.map((investment) => {
                  const isSelected = investment.id === selectedInvestmentId;
                  const reinvestmentStart = addDays(investment.maturityDate, 10);
                  const isEditingDates = editModeId === investment.id;
                  const showReinvestBox = showReinvestBoxId === investment.id;
                  const badgeStyle = getStatusBadgeStyle(investment.status);

                  return (
                    <div
                      key={investment.id}
                      className={`investment-item ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedInvestmentId(investment.id)}
                    >
                      <div className="investment-top">
                        <div style={{ flex: 1 }}>
                          <div className="investment-header-row">
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
                          </div>

                          <div className="invoice-line">
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
                              className="btn-light danger-btn"
                              type="button"
                              onClick={() => deleteInvestment(investment.id)}
                            >
                              Delete
                            </button>
                          </div>

                          {isEditingDates && (
                            <div className="note-box" style={{ marginTop: 16 }}>
                              <div className="mini-form-row">
                                <div>
                                  <label>Maturity Date</label>
                                  <input
                                    type="date"
                                    value={editMaturityDate}
                                    onChange={(e) =>
                                      setEditMaturityDate(e.target.value)
                                    }
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
                              <div className="mini-form-row">
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
                        </div>

                        <div className="investor-summary">
                          <strong>Borrowed Investors</strong>
                          <div style={{ marginTop: 12 }}>
                            {(investment.borrowedInvestors || []).length === 0 ? (
                              <div className="muted-text">No borrowed investors</div>
                            ) : (
                              investment.borrowedInvestors.map((item) => (
                                <div key={item.id} className="borrowed-row">
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
          </>
        )}

        {activeTab === "investors" && (
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-head">
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                Investor Module
              </h2>
            </div>

            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                value={investorSearchTerm}
                onChange={(e) => setInvestorSearchTerm(e.target.value)}
                placeholder="Search borrowed investor name"
              />
            </div>

            {filteredInvestorSummaryRows.length === 0 ? (
              <div className="empty-box">No investor records found</div>
            ) : (
              filteredInvestorSummaryRows.map((item) => (
                <div className="investment-item" key={item.id}>
                  <div className="investment-top">
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0 }}>{item.name}</h3>
                      <div className="meta-grid" style={{ marginTop: 16 }}>
                        <div>
                          <strong>Total Current Amount:</strong>{" "}
                          {formatCurrency(item.totalAmount)}
                        </div>
                        <div>
                          <strong>Current Investments:</strong>{" "}
                          {item.investmentCount}
                        </div>
                        <div>
                          <strong>Invoices:</strong>{" "}
                          {item.invoiceNumbers.join(", ")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "merge" && (
          <div className="card" style={{ marginTop: 24 }}>
            <h2 className="section-title">Merge Matured Invoices</h2>
            <p className="section-text">
              Select at least 2 matured invoices. Merge invoice number is manual.
              Merge investment date is manual. Merge maturity date is manual.
            </p>

            {error && <div className="alert-error">{error}</div>}
            {success && <div className="alert-success">{success}</div>}

            <div className="form-grid">
              <div>
                <label>Merged Invoice Number</label>
                <input
                  type="text"
                  value={mergeInvoiceNumber}
                  onChange={(e) => setMergeInvoiceNumber(e.target.value)}
                  placeholder="Enter merged invoice number"
                />
              </div>

              <div>
                <label>Merged Investment Date</label>
                <input
                  type="date"
                  value={mergeInvestmentDate}
                  onChange={(e) => setMergeInvestmentDate(e.target.value)}
                />
              </div>

              <div>
                <label>Merged Maturity Date</label>
                <input
                  type="date"
                  value={mergeMaturityDate}
                  onChange={(e) => setMergeMaturityDate(e.target.value)}
                />
              </div>
            </div>

            <div className="stats-grid" style={{ marginTop: 20 }}>
              <div className="stat-box">
                <div className="stat-label">Selected Invoices</div>
                <div className="stat-value">{selectedMergeInvestments.length}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Selected Total Amount</div>
                <div className="stat-value">
                  {formatCurrency(selectedMergeTotalAmount)}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Selected Borrowed Amount</div>
                <div className="stat-value">
                  {formatCurrency(selectedMergeBorrowedAmount)}
                </div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Selected Self Invested</div>
                <div className="stat-value">
                  {formatCurrency(selectedMergeSelfAmount)}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              {mergeCandidates.length === 0 ? (
                <div className="empty-box">
                  No matured invoices available for merge
                </div>
              ) : (
                mergeCandidates.map((item) => (
                  <div
                    key={item.id}
                    className="investment-item"
                    style={{ marginBottom: 12 }}
                  >
                    <div
                      className="investment-top"
                      style={{ alignItems: "center", gap: 16 }}
                    >
                      <div style={{ minWidth: 32 }}>
                        <input
                          type="checkbox"
                          checked={mergeSelectionIds.includes(item.id)}
                          onChange={() => toggleMergeSelection(item.id)}
                        />
                      </div>

                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: 0 }}>{item.investmentName}</h3>
                        <div className="meta-grid" style={{ marginTop: 14 }}>
                          <div>
                            <strong>Invoice:</strong> {item.invoiceNumber}
                          </div>
                          <div>
                            <strong>Total:</strong>{" "}
                            {formatCurrency(item.totalAmount)}
                          </div>
                          <div>
                            <strong>Borrowed:</strong>{" "}
                            {formatCurrency(item.borrowedAmount)}
                          </div>
                          <div>
                            <strong>Investment Date:</strong>{" "}
                            {formatDisplayDate(item.investmentDate)}
                          </div>
                          <div>
                            <strong>Maturity:</strong>{" "}
                            {formatDisplayDate(item.maturityDate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="btn-row" style={{ marginTop: 24 }}>
              <button
                className="btn-dark"
                type="button"
                onClick={createMergedInvestment}
              >
                Create Merged Investment
              </button>
              <button
                className="btn-light"
                type="button"
                onClick={resetMergeForm}
              >
                Clear Merge Selection
              </button>
            </div>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="card list-card" style={{ marginTop: 24 }}>
            <div className="list-head">
              <div>
                <h2 className="section-title" style={{ marginBottom: 4 }}>
                  Report Module
                </h2>
                <p className="section-text" style={{ margin: 0 }}>
                  Reinvestment flow is grouped at the top. Existing reinvestment and
                  merge records are shown below.
                </p>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <input
                type="text"
                value={reportSearchTerm}
                onChange={(e) => setReportSearchTerm(e.target.value)}
                placeholder="Search reports by invoice or investment name"
              />
            </div>

            <div className="note-box" style={{ marginBottom: 20 }}>
              <strong style={{ fontSize: 16 }}>Reinvestment Flow View</strong>
              <div style={{ marginTop: 14 }}>
                {reinvestmentFlowReports.length === 0 ? (
                  <div className="muted-text">No reinvestment flows found</div>
                ) : (
                  reinvestmentFlowReports.map((flow) => (
                    <div
                      key={flow.id}
                      className="investment-item"
                      style={{ marginBottom: 14, cursor: "default" }}
                    >
                      <div style={{ flex: 1 }}>
                        <div className="investment-header-row">
                          <h3 style={{ margin: 0 }}>
                            {flow.chain.map((item) => item.invoiceNumber).join(" → ")}
                          </h3>
                          <div
                            className="badge"
                            style={{
                              background: getStatusBadgeStyle(flow.latest.status).background,
                              color: getStatusBadgeStyle(flow.latest.status).color,
                              border: getStatusBadgeStyle(flow.latest.status).border,
                            }}
                          >
                            {flow.latest.status}
                          </div>
                        </div>

                        <div className="meta-grid" style={{ marginTop: 16 }}>
                          <div>
                            <strong>Initial Invoice:</strong> {flow.root.invoiceNumber}
                          </div>
                          <div>
                            <strong>Latest Invoice:</strong> {flow.latest.invoiceNumber}
                          </div>
                          <div>
                            <strong>Initial Investment Date:</strong>{" "}
                            {formatDisplayDate(flow.root.investmentDate)}
                          </div>
                          <div>
                            <strong>Latest Investment Date:</strong>{" "}
                            {formatDisplayDate(flow.latest.investmentDate)}
                          </div>
                          <div>
                            <strong>Current Total Amount:</strong>{" "}
                            {formatCurrency(flow.latest.totalAmount)}
                          </div>
                          <div>
                            <strong>Current Borrowed Amount:</strong>{" "}
                            {formatCurrency(flow.latest.borrowedAmount)}
                          </div>
                        </div>

                        <div className="note-box" style={{ marginTop: 16 }}>
                          <strong>Flow Breakdown</strong>
                          <div style={{ marginTop: 10 }}>
                            {flow.chain.map((item, index) => (
                              <div
                                key={item.id}
                                style={{
                                  display: "flex",
                                  gap: 12,
                                  flexWrap: "wrap",
                                  marginBottom: 10,
                                  color: "#cbd5e1",
                                  fontSize: 14,
                                }}
                              >
                                <div>
                                  <strong>Step {index + 1}:</strong> {item.invoiceNumber}
                                </div>
                                <div>
                                  <strong>Name:</strong> {item.investmentName}
                                </div>
                                <div>
                                  <strong>Date:</strong>{" "}
                                  {formatDisplayDate(item.investmentDate)}
                                </div>
                                <div>
                                  <strong>Maturity:</strong>{" "}
                                  {formatDisplayDate(item.maturityDate)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="note-box" style={{ marginBottom: 20 }}>
              <strong style={{ fontSize: 16 }}>Detailed Existing Records</strong>
            </div>

            {reportRecords.length === 0 ? (
              <div className="empty-box">No report records found</div>
            ) : (
              reportRecords.map((investment) => {
                const badgeStyle = getStatusBadgeStyle(investment.status);
                const investmentChain = getInvestmentChain(investment.id);
                const mergeSources = (investment.mergeSourceInvestmentIds || [])
                  .map((id) => investments.find((item) => item.id === id))
                  .filter(Boolean);

                const isMergedRecord =
                  Array.isArray(investment.mergeSourceInvestmentIds) &&
                  investment.mergeSourceInvestmentIds.length > 0;

                return (
                  <div
                    key={investment.id}
                    className="investment-item"
                    style={{ marginBottom: 16 }}
                  >
                    <div className="investment-top">
                      <div style={{ flex: 1 }}>
                        <div className="investment-header-row">
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
                        </div>

                        <div className="invoice-line">
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
                        </div>

                        {investment.parentInvestmentId && (
                          <div className="note-box" style={{ marginTop: 16 }}>
                            <strong>Reinvestment Summary</strong>
                            <div className="report-detail">
                              <div>
                                <strong>Invoice Chain:</strong>{" "}
                                {investmentChain
                                  .map((item) => item.invoiceNumber)
                                  .join(" → ")}
                              </div>
                              <div style={{ marginTop: 6 }}>
                                <strong>Initial Investment Date:</strong>{" "}
                                {investmentChain.length > 0
                                  ? formatDisplayDate(
                                      investmentChain[0].investmentDate
                                    )
                                  : "-"}
                              </div>
                              <div style={{ marginTop: 6 }}>
                                <strong>Initial Invoice:</strong>{" "}
                                {investmentChain.length > 0
                                  ? investmentChain[0].invoiceNumber
                                  : "-"}
                              </div>
                            </div>
                          </div>
                        )}

                        {isMergedRecord && (
                          <div className="note-box" style={{ marginTop: 16 }}>
                            <strong>Merge Summary</strong>
                            <div className="report-detail">
                              <div>
                                <strong>Merged From Invoices:</strong>{" "}
                                {mergeSources.length === 0
                                  ? "-"
                                  : mergeSources
                                      .map((item) => item.invoiceNumber)
                                      .join(" + ")}
                              </div>
                              <div style={{ marginTop: 6 }}>
                                <strong>Initial Investment Dates:</strong>{" "}
                                {mergeSources.length === 0
                                  ? "-"
                                  : mergeSources
                                      .map(
                                        (item) =>
                                          `${item.invoiceNumber} (${formatDisplayDate(
                                            item.investmentDate
                                          )})`
                                      )
                                      .join(", ")}
                              </div>
                              <div style={{ marginTop: 6 }}>
                                <strong>Source Borrowed Investors:</strong>
                                <div style={{ marginTop: 6 }}>
                                  {mergeSources.length === 0 ? (
                                    <div>-</div>
                                  ) : (
                                    mergeSources.map((source) => (
                                      <div
                                        key={source.id}
                                        style={{ marginBottom: 6 }}
                                      >
                                        <strong>{source.invoiceNumber}:</strong>{" "}
                                        {(source.borrowedInvestors || []).length === 0
                                          ? "No borrowed investors"
                                          : source.borrowedInvestors
                                              .map(
                                                (item) =>
                                                  `${item.name} (${formatCurrency(
                                                    item.amount
                                                  )})`
                                              )
                                              .join(", ")}
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {investment.status === "reinvested" && (
                          <div className="note-box" style={{ marginTop: 16 }}>
                            Previous invoice moved here after reinvestment.
                          </div>
                        )}

                        {investment.status === "merged" && (
                          <div className="note-box" style={{ marginTop: 16 }}>
                            Previous invoice moved here after merge.
                          </div>
                        )}
                      </div>

                      <div className="investor-summary">
                        <strong>Borrowed Investors</strong>
                        <div style={{ marginTop: 12 }}>
                          {(investment.borrowedInvestors || []).length === 0 ? (
                            <div className="muted-text">No borrowed investors</div>
                          ) : (
                            investment.borrowedInvestors.map((item) => (
                              <div key={item.id} className="borrowed-row">
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
        )}
      </div>

      <style jsx>{`
        :global(body) {
          margin: 0;
          background:
            radial-gradient(circle at top left, rgba(99, 102, 241, 0.14), transparent 28%),
            radial-gradient(circle at top right, rgba(34, 197, 94, 0.1), transparent 24%),
            linear-gradient(180deg, #030712 0%, #07111f 45%, #020617 100%);
          color: #e2e8f0;
          font-family: Inter, Arial, sans-serif;
        }

        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          padding: 32px 18px 50px;
          position: relative;
          overflow: hidden;
        }

        .container {
          max-width: 1480px;
          margin: 0 auto;
          position: relative;
          z-index: 2;
        }

        .bg-orb {
          position: fixed;
          border-radius: 999px;
          filter: blur(80px);
          opacity: 0.22;
          pointer-events: none;
          z-index: 0;
        }

        .orb-1 {
          width: 260px;
          height: 260px;
          background: #22c55e;
          top: 70px;
          left: -80px;
        }

        .orb-2 {
          width: 320px;
          height: 320px;
          background: #6366f1;
          top: 120px;
          right: -110px;
        }

        .orb-3 {
          width: 240px;
          height: 240px;
          background: #a855f7;
          bottom: 60px;
          left: 35%;
        }

        .card {
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.88), rgba(2, 6, 23, 0.92));
          border: 1px solid rgba(148, 163, 184, 0.14);
          border-radius: 24px;
          padding: 24px;
          box-shadow:
            0 20px 60px rgba(0, 0, 0, 0.35),
            inset 0 1px 0 rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(14px);
        }

        .hero-card {
          padding: 28px;
          background:
            linear-gradient(135deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.95)),
            linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(34, 197, 94, 0.06));
        }

        .hero-top {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .eyebrow {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #c7d2fe;
          background: rgba(99, 102, 241, 0.14);
          border: 1px solid rgba(99, 102, 241, 0.28);
          margin-bottom: 14px;
        }

        .header-title {
          margin: 0;
          font-size: 34px;
          line-height: 1.1;
          color: #f8fafc;
          letter-spacing: -0.02em;
        }

        .header-subtitle {
          margin: 10px 0 0;
          font-size: 15px;
          color: #94a3b8;
        }

        .section-title {
          margin: 0 0 8px;
          color: #f8fafc;
          font-size: 22px;
          letter-spacing: -0.01em;
        }

        .section-text {
          color: #94a3b8;
          font-size: 14px;
          line-height: 1.6;
        }

        .grid {
          display: grid;
          gap: 16px;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }

        .main-grid {
          grid-template-columns: minmax(0, 1.1fr) minmax(360px, 0.9fr);
          align-items: start;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
        }

        .dashboard-top .stat-box {
          min-height: 120px;
        }

        .stat-box {
          padding: 18px;
          border-radius: 20px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.72), rgba(15, 23, 42, 0.52));
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
        }

        .stat-box.premium {
          background:
            linear-gradient(135deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.92)),
            linear-gradient(135deg, rgba(99, 102, 241, 0.08), rgba(34, 197, 94, 0.06));
          border: 1px solid rgba(99, 102, 241, 0.16);
        }

        .stat-label {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #94a3b8;
          margin-bottom: 10px;
        }

        .stat-value {
          font-size: 22px;
          line-height: 1.3;
          color: #f8fafc;
          font-weight: 700;
          word-break: break-word;
        }

        .investor-box,
        .note-box {
          margin-top: 20px;
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.14);
          background: rgba(15, 23, 42, 0.55);
          padding: 20px;
        }

        .investor-head,
        .list-head,
        .card-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }

        .investor-item {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 14px;
          padding: 16px;
          margin-bottom: 12px;
          border-radius: 18px;
          background: rgba(2, 6, 23, 0.38);
          border: 1px solid rgba(148, 163, 184, 0.12);
        }

        .btn-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .btn-dark,
        .btn-light {
          border: none;
          border-radius: 14px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.22s ease;
        }

        .btn-dark {
          color: #ffffff;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          box-shadow: 0 12px 28px rgba(79, 70, 229, 0.28);
        }

        .btn-dark:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 34px rgba(79, 70, 229, 0.34);
        }

        .btn-light {
          color: #e2e8f0;
          background: rgba(15, 23, 42, 0.78);
          border: 1px solid rgba(148, 163, 184, 0.18);
        }

        .btn-light:hover {
          transform: translateY(-1px);
          background: rgba(30, 41, 59, 0.9);
        }

        .danger-btn:hover {
          border-color: rgba(248, 113, 113, 0.35);
          color: #fecaca;
        }

        .full-width-btn {
          width: 100%;
        }

        label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          color: #cbd5e1;
          font-weight: 600;
        }

        input {
          width: 100%;
          border-radius: 14px;
          border: 1px solid rgba(148, 163, 184, 0.16);
          background: rgba(2, 6, 23, 0.72);
          color: #f8fafc;
          padding: 12px 14px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }

        input::placeholder {
          color: #64748b;
        }

        input:focus {
          border-color: rgba(99, 102, 241, 0.58);
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
          background: rgba(2, 6, 23, 0.92);
        }

        input[type="checkbox"] {
          width: 18px;
          height: 18px;
          accent-color: #6366f1;
          cursor: pointer;
        }

        .alert-error,
        .alert-success,
        .empty-box {
          margin-top: 18px;
          padding: 14px 16px;
          border-radius: 16px;
          font-size: 14px;
          font-weight: 600;
        }

        .alert-error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #fecaca;
        }

        .alert-success {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.25);
          color: #bbf7d0;
        }

        .empty-box {
          background: rgba(15, 23, 42, 0.6);
          border: 1px dashed rgba(148, 163, 184, 0.2);
          color: #94a3b8;
          text-align: center;
        }

        .list-card {
          overflow: hidden;
        }

        .investment-item {
          border-radius: 22px;
          border: 1px solid rgba(148, 163, 184, 0.12);
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.74), rgba(2, 6, 23, 0.78));
          padding: 20px;
          margin-bottom: 14px;
          transition: all 0.2s ease;
          cursor: pointer;
        }

        .investment-item:hover {
          transform: translateY(-1px);
          border-color: rgba(99, 102, 241, 0.22);
        }

        .investment-item.selected {
          border-color: rgba(99, 102, 241, 0.4);
          box-shadow: 0 0 0 1px rgba(99, 102, 241, 0.18);
        }

        .investment-top {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 320px;
          gap: 18px;
          align-items: start;
        }

        .investment-header-row {
          display: flex;
          gap: 12px;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        }

        .invoice-line {
          margin-top: 14px;
          margin-bottom: 14px;
          color: #e2e8f0;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }

        .meta-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
          font-size: 14px;
          color: #cbd5e1;
        }

        .investor-summary {
          border-radius: 20px;
          background: rgba(2, 6, 23, 0.5);
          border: 1px solid rgba(148, 163, 184, 0.12);
          padding: 18px;
          min-height: 100%;
        }

        .borrowed-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
          font-size: 14px;
          color: #e2e8f0;
        }

        .muted-text {
          font-size: 14px;
          color: #94a3b8;
        }

        .mini-form-row {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          align-items: end;
        }

        .report-detail {
          margin-top: 10px;
          font-size: 14px;
          color: #cbd5e1;
        }

        @media (max-width: 1180px) {
          .main-grid {
            grid-template-columns: 1fr;
          }

          .investment-top {
            grid-template-columns: 1fr;
          }

          .investor-summary {
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .page {
            padding: 20px 12px 36px;
          }

          .card,
          .hero-card {
            padding: 18px;
            border-radius: 20px;
          }

          .header-title {
            font-size: 28px;
          }

          .stat-value {
            font-size: 19px;
          }

          .investment-item {
            padding: 16px;
          }

          .meta-grid,
          .form-grid,
          .stats-grid,
          .grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
