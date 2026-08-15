"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "./status-badge";
import { AlertTriangle, Thermometer, Droplets, Calendar } from "lucide-react";

const VARIETIES = ["AKALA", "ARANA", "CASCADE", "CORINDI", "KIRRA", "SEKOYA POP"];

interface OverpackResult {
  variety: string;
  freightType: string;
  baseOverpack: number;
  tempAdjustment: number;
  seasonAdjustment: number;
  brixAdjustment: number;
  recommendedOverpack: number;
  riskLevel: string;
  kgToAdd: number;
  shipmentWeight: number;
  flatRate: number;
  flatKg: number;
  extraVsFlat: number;
  warnings: {
    highTemp: boolean;
    veryHighTemp: boolean;
    lowBrix: boolean;
    lateSeason: boolean;
    veryLateSeason: boolean;
  };
}

export function OverpackCalculator() {
  const [variety, setVariety] = useState("");
  const [pickTemp, setPickTemp] = useState("");
  const [brix, setBrix] = useState("");
  const [freight, setFreight] = useState("AIR");
  const [week, setWeek] = useState("");
  const [shipmentWeight, setShipmentWeight] = useState("1000");
  const [result, setResult] = useState<OverpackResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function calculate() {
    if (!variety) return;
    setLoading(true);
    const params = new URLSearchParams({
      variety,
      freightType: freight,
      pickTemp: pickTemp || "0",
      week: week || "0",
      brix: brix || "0",
      shipmentWeight: shipmentWeight || "1000",
    });
    const res = await fetch(`/api/shelf-life/predict/overpack?${params}`);
    const data = await res.json();
    setResult(data);
    setLoading(false);
  }

  const tempNum = parseFloat(pickTemp);
  const brixNum = parseFloat(brix);
  const weekNum = parseInt(week);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-1">
          <Label>Variety *</Label>
          <Select value={variety} onValueChange={setVariety}>
            <SelectTrigger>
              <SelectValue placeholder="Select variety" />
            </SelectTrigger>
            <SelectContent>
              {VARIETIES.map((v) => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label>Freight Type</Label>
          <Select value={freight} onValueChange={setFreight}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="AIR">AIR</SelectItem>
              <SelectItem value="SEA">SEA</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="flex items-center gap-1">
            <Thermometer className="h-3 w-3" /> Pick Temp (°C)
          </Label>
          <Input type="number" step="0.1" value={pickTemp} onChange={(e) => setPickTemp(e.target.value)} placeholder="e.g. 32.5" />
          {tempNum > 35 && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Very high temp — +0.25%/°C above 35°C
            </p>
          )}
          {tempNum > 30 && tempNum <= 35 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> High temp — +0.15%/°C above 30°C
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="flex items-center gap-1">
            <Droplets className="h-3 w-3" /> Brix
          </Label>
          <Input type="number" step="0.1" value={brix} onChange={(e) => setBrix(e.target.value)} placeholder="e.g. 12.5" />
          {brixNum > 0 && brixNum < 10.5 && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Low Brix — +1% overpack
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Week
          </Label>
          <Input type="number" value={week} onChange={(e) => setWeek(e.target.value)} placeholder="e.g. 28" />
          {weekNum >= 31 && <p className="text-xs text-amber-600">Late season — +2.5%</p>}
          {weekNum >= 27 && weekNum < 31 && <p className="text-xs text-amber-600">Seasonal adjustment — +1.5%</p>}
        </div>

        <div className="space-y-1">
          <Label>Shipment Weight (kg)</Label>
          <Input type="number" value={shipmentWeight} onChange={(e) => setShipmentWeight(e.target.value)} />
        </div>
      </div>

      <Button onClick={calculate} disabled={!variety || loading} className="w-full md:w-auto">
        {loading ? "Calculating..." : "Calculate Overpack"}
      </Button>

      {result && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Recommended Overpack</p>
            <p className="text-3xl font-bold text-blue-700">{result.recommendedOverpack}%</p>
            <div className="mt-2"><StatusBadge status={result.riskLevel} /></div>
          </div>
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Kg to Add</p>
            <p className="text-3xl font-bold text-emerald-700">{result.kgToAdd} kg</p>
            <p className="text-xs text-gray-400 mt-1">on {result.shipmentWeight} kg shipment</p>
          </div>
          <div className="bg-white border rounded-xl p-5 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">vs Flat Rate ({result.flatRate}%)</p>
            <p className={`text-3xl font-bold ${result.extraVsFlat > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {result.extraVsFlat > 0 ? "+" : ""}{result.extraVsFlat} kg
            </p>
            <p className="text-xs text-gray-400 mt-1">Flat would be {result.flatKg} kg</p>
          </div>

          <div className="md:col-span-3 bg-gray-50 border rounded-xl p-4">
            <p className="text-sm font-medium mb-2">Breakdown</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
              <div className="bg-white rounded-lg p-3 border"><p className="text-gray-500 text-xs">Base</p><p className="font-semibold">{result.baseOverpack}%</p></div>
              <div className="bg-white rounded-lg p-3 border"><p className="text-gray-500 text-xs">Temp</p><p className="font-semibold">+{result.tempAdjustment}%</p></div>
              <div className="bg-white rounded-lg p-3 border"><p className="text-gray-500 text-xs">Season</p><p className="font-semibold">+{result.seasonAdjustment}%</p></div>
              <div className="bg-white rounded-lg p-3 border"><p className="text-gray-500 text-xs">Brix</p><p className="font-semibold">+{result.brixAdjustment}%</p></div>
              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200"><p className="text-blue-600 text-xs">Total</p><p className="font-semibold text-blue-700">{result.recommendedOverpack}%</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
