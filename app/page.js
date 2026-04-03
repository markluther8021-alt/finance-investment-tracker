"use client";

import { useMemo, useState } from "react";

type InvestorType = "own" | "borrowed";
type InvestmentStatus = "active" | "matured" | "reinvested";

type Investor = {
  id: string;
  name: string;
  amount: number;
  type: InvestorType;
};

type Investment = {
  id: string;
  investmentName: string;
  totalAmount: number;
  investmentDate: string;
  maturityDate: string;
  investors: Investor[];
  status: InvestmentStatus;
  parentInvestmentId?: string;
};

const generateId = () => Math.random().toString(36).slice(2, 10);

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toISOString().split("T")[0];
};

const addDays = (dateStr: string, days: number) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  date.setDate(date.getDate() + days);
  return formatDate(date.toISOString());
};

const sumInvestorAmount = (investors: Investor[]) =>
  investors.reduce((sum, investor) => sum + Number(investor.amount || 0), 0);

const sumBorrowedAmount = (investors: Investor[]) =>
  investors
    .filter((investor) => investor.type === "borrowed")
    .reduce((sum, investor) => sum + Number(investor.amount || 0), 0);

export default function Page() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState("");

  const [investmentName, setInvestmentName] = useState("");
  const [totalAmount, setTotalAmount] = useState<number | "">("");
  const [investmentDate, setInvestmentDate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");

  const [investors, setInvestors] = useState<Investor[]>([
    {
      id: generateId(),
      name: "",
      amount: 0,
      type: "own",
    },
  ]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const investorTotal = useMemo(() => sumInvestorAmount(investors), [investors]);
  const borrowedTotal = useMemo(() => sumBorrowedAmount(investors), [investors]);

  const selectedInvestment = useMemo(
    () => investments.find((item) => item.id === selectedInvestmentId),
    [investments, selectedInvestmentId]
  );

  const resetForm = () => {
    setInvestmentName("");
    setTotalAmount("");
    setInvestmentDate("");
    setMaturityDate("");
    setInvestors([
      {
        id: generateId(),
        name: "",
        amount: 0,
        type: "own",
      },
    ]);
  };

  const handleInvestorChange = (
    id: string,
    field: keyof Investor,
    value: string | number
  ) => {
    setInvestors((prev) =>
      prev.map((investor) =>
        investor.id === id ? { ...investor, [field]: value } : investor
      )
    );
  };

  const addInvestor = () => {
    setInvestors((prev) => [
      ...prev,
      {
        id: generateId(),
        name: "",
        amount: 0,
        type: "own",
      },
    ]);
  };

  const removeInvestor = (id: string) => {
    setInvestors((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((investor) => investor.id !== id);
    });
  };

  const validateInvestment = () => {
    if (!investmentName.trim()) return "Investment name is required";
    if (totalAmount === "" || Number(totalAmount) <= 0) {
      return "Total investment amount must be greater than 0";
    }
    if (!investmentDate) return "Investment date is required";
    if (!maturityDate) return "Maturity date is required";

    const investmentStart = new Date(investmentDate);
    const investmentEnd = new Date(maturityDate);

    if (investmentEnd < investmentStart) {
      return "Maturity date cannot be before investment date";
    }

    const hasInvalidInvestor = investors.some(
      (investor) => !investor.name.trim() || Number(investor.amount) <= 0
    );

    if (hasInvalidInvestor) {
      return "Each investor must have a name and amount greater than 0";
    }

    if (investorTotal !== Number(totalAmount)) {
      return `Investor total (${investorTotal}) must equal total investment (${Number(
        totalAmount
      )})`;
    }

    if (borrowedTotal > Number(totalAmount)) {
      return "Borrowed amount cannot exceed total investment";
    }

    return "";
  };

  const saveInvestment = () => {
    setError("");
    setSuccess("");

    const validationError = validateInvestment();
    if (validationError) {
      setError(validationError);
      return;
    }

    const newInvestment: Investment = {
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
    };

    setInvestments((prev) => [newInvestment, ...prev]);
    setSelectedInvestmentId(newInvestment.id);
    resetForm();
    setSuccess("Investment saved successfully");
  };

  const markAsMatured = (investmentId: string) => {
    setInvestments((prev) =>
      prev.map((item) =>
        item.id === investmentId ? { ...item, status: "matured" } : item
      )
    );
  };

  const reinvestSelectedInvestment = () => {
    if (!selectedInvestment) return;

    const nextInvestmentDate = addDays(selectedInvestment.maturityDate, 10);

    if (!nextInvestmentDate) {
      setError("Unable to calculate reinvestment date");
      return;
    }

    const newMaturityDate = selectedInvestment.maturityDate;

    const reinvestment: Investment = {
      id: generateId(),
      investmentName: `${selectedInvestment.investmentName} - Reinvestment`,
      totalAmount: selectedInvestment.totalAmount,
      investmentDate: nextInvestmentDate,
      maturityDate: newMaturityDate,
      investors: selectedInvestment.investors.map((investor) => ({
        ...investor,
        id: generateId(),
      })),
      status: "active",
      parentInvestmentId: selectedInvestment.id,
    };

    setInvestments((prev) => {
      const updated = prev.map((item) =>
        item.id === selectedInvestment.id
          ? { ...item, status: "reinvested" as InvestmentStatus }
          : item
      );
      return [reinvestment, ...updated];
    });

    setSelectedInvestmentId(reinvestment.id);
    setSuccess("Reinvestment created successfully");
    setError("");
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm border">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Finance Investment Tracker
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Module 1 - Investment Management
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2">
            <div className="rounded-2xl bg-white p-6 shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-5">
                Add New Investment
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Investment Name
                  </label>
                  <input
                    type="text"
                    value={investmentName}
                    onChange={(e) => setInvestmentName(e.target.value)}
                    placeholder="Enter investment name"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Total Investment Amount
                  </label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) =>
                      setTotalAmount(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    placeholder="Enter total amount"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Investment Date
                  </label>
                  <input
                    type="date"
                    value={investmentDate}
                    onChange={(e) => setInvestmentDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Maturity Date
                  </label>
                  <input
                    type="date"
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                  />
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-gray-200 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Investors
                  </h3>
                  <button
                    type="button"
                    onClick={addInvestor}
                    className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                  >
                    + Add Investor
                  </button>
                </div>

                <div className="space-y-4">
                  {investors.map((investor, index) => (
                    <div
                      key={investor.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 rounded-xl border border-gray-200 p-4"
                    >
                      <div className="md:col-span-4">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Investor Name
                        </label>
                        <input
                          type="text"
                          value={investor.name}
                          onChange={(e) =>
                            handleInvestorChange(
                              investor.id,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder={`Investor ${index + 1}`}
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Amount
                        </label>
                        <input
                          type="number"
                          value={investor.amount || ""}
                          onChange={(e) =>
                            handleInvestorChange(
                              investor.id,
                              "amount",
                              Number(e.target.value)
                            )
                          }
                          placeholder="Amount"
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Type
                        </label>
                        <select
                          value={investor.type}
                          onChange={(e) =>
                            handleInvestorChange(
                              investor.id,
                              "type",
                              e.target.value as InvestorType
                            )
                          }
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-black"
                        >
                          <option value="own">Own</option>
                          <option value="borrowed">Borrowed</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                          Action
                        </label>
                        <button
                          type="button"
                          onClick={() => removeInvestor(investor.id)}
                          disabled={investors.length === 1}
                          className="w-full rounded-xl border px-4 py-3 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl bg-gray-50 p-4 border">
                    <p className="text-sm text-gray-600">Total from Investors</p>
                    <p className="mt-1 text-xl font-bold text-gray-900">
                      {investorTotal}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-4 border">
                    <p className="text-sm text-gray-600">Borrowed Amount</p>
                    <p className="mt-1 text-xl font-bold text-gray-900">
                      {borrowedTotal}
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveInvestment}
                  className="rounded-xl bg-black px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
                >
                  Save Investment
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border px-5 py-3 text-sm font-semibold hover:bg-gray-50"
                >
                  Clear Form
                </button>
              </div>
            </div>
          </div>

          <div className="xl:col-span-1">
            <div className="rounded-2xl bg-white p-6 shadow-sm border">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Investment Summary
              </h2>

              <div className="space-y-3">
                <div className="rounded-xl bg-gray-50 border p-4">
                  <p className="text-sm text-gray-600">Total Investments</p>
                  <p className="mt-1 text-2xl font-bold">{investments.length}</p>
                </div>

                <div className="rounded-xl bg-gray-50 border p-4">
                  <p className="text-sm text-gray-600">Active</p>
                  <p className="mt-1 text-2xl font-bold">
                    {investments.filter((i) => i.status === "active").length}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 border p-4">
                  <p className="text-sm text-gray-600">Matured</p>
                  <p className="mt-1 text-2xl font-bold">
                    {investments.filter((i) => i.status === "matured").length}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 border p-4">
                  <p className="text-sm text-gray-600">Reinvested</p>
                  <p className="mt-1 text-2xl font-bold">
                    {investments.filter((i) => i.status === "reinvested").length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm border">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
            <h2 className="text-xl font-semibold text-gray-900">
              Investment List
            </h2>

            {selectedInvestment && (
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => markAsMatured(selectedInvestment.id)}
                  className="rounded-xl border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Mark as Matured
                </button>

                <button
                  type="button"
                  onClick={reinvestSelectedInvestment}
                  className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Reinvest (+10 days)
                </button>
              </div>
            )}
          </div>

          {investments.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-gray-500">
              No investments added yet
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {investments.map((investment) => {
                const isSelected = selectedInvestmentId === investment.id;
                const nextReinvestmentDate = addDays(investment.maturityDate, 10);

                return (
                  <div
                    key={investment.id}
                    onClick={() => setSelectedInvestmentId(investment.id)}
                    className={`cursor-pointer rounded-2xl border p-5 transition ${
                      isSelected
                        ? "border-black bg-gray-50"
                        : "border-gray-200 bg-white hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {investment.investmentName}
                        </h3>

                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                          <p>
                            <span className="font-medium text-gray-800">
                              Total:
                            </span>{" "}
                            {investment.totalAmount}
                          </p>
                          <p>
                            <span className="font-medium text-gray-800">
                              Status:
                            </span>{" "}
                            {investment.status}
                          </p>
                          <p>
                            <span className="font-medium text-gray-800">
                              Investment Date:
                            </span>{" "}
                            {investment.investmentDate}
                          </p>
                          <p>
                            <span className="font-medium text-gray-800">
                              Maturity Date:
                            </span>{" "}
                            {investment.maturityDate}
                          </p>
                          <p className="md:col-span-2">
                            <span className="font-medium text-gray-800">
                              Reinvestment Start:
                            </span>{" "}
                            {nextReinvestmentDate}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-[220px] rounded-xl border bg-white p-4">
                        <p className="text-sm font-semibold text-gray-800 mb-3">
                          Investors
                        </p>
                        <div className="space-y-2">
                          {investment.investors.map((inv) => (
                            <div
                              key={inv.id}
                              className="flex items-center justify-between text-sm"
                            >
                              <div>
                                <span className="font-medium text-gray-800">
                                  {inv.name}
                                </span>
                                <span className="ml-2 text-gray-500">
                                  ({inv.type})
                                </span>
                              </div>
                              <span className="font-medium">{inv.amount}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {investment.parentInvestmentId && (
                      <div className="mt-4 rounded-xl bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
                        This is a reinvestment record
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
