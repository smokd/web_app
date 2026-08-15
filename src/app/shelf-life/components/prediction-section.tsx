"use client";

import { useState } from "react";
import { ShelfLifePredictionCard } from "./shelf-life-prediction-card";
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
import { AlertTriangle, Thermometer, Droplets, Calendar, Scale } from "lucide-react";

const VARIETIES = ["AKALA", "ARANA", "CASCADE", "CORINDI", "KIRRA", "SEKOYA POP"];

export function PredictionSection() {
  const [variety, setVariety] = useState("");
  const [pickTemp, setPickTemp] = useState("");
  const [brix, setBrix] = useState("");
  const [freight, setFreight] = useState("AIR");
  const [week, setWeek] = useState("");
  const [packWeight, setPackWeight] = useState("");
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function predict() {
    if (!variety || !pickTemp || !brix) return;
    setLoading(true);
    const params = new URLSearchParams({
      variety,
      pickTemp,
      brix,
      freightType: freight,
      ...(week && { week }),
      ...(packWeight && { packWeight }),
    });
    const res = await fetch(`/api/shelf-life/predict/shelf-life?${params}`);
    const data = await res.json();
    setPrediction(data);
    setLoading(false);
  }

  const tempNum = parseFloat(pickTemp);
  const brixNum = parseFloat(brix);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
          <Label className="flex items-center gap-1">
            <Thermometer className="h-3 w-3" /> Pick Temp (°C) *
          </Label>
          <Input type="number" step="0.1" value={pickTemp} onChange={(e) => setPickTemp(e.target.value)} placeholder="e.g. 32.5" />
          {tempNum > 35 && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Very high temp
            </p>
          )}
        </div>

        <div className="space-y-1">
          <Label className="flex items-center gap-1">
            <Droplets className="h-3 w-3" /> Brix *
          </Label>
          <Input type="number" step="0.1" value={brix} onChange={(e) => setBrix(e.target.value)} placeholder="e.g. 12.5" />
          {brixNum > 0 && brixNum < 10.5 && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" /> Low Brix
            </p>
          )}
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
            <Calendar className="h-3 w-3" /> Week
          </Label>
          <Input type="number" value={week} onChange={(e) => setWeek(e.target.value)} placeholder="e.g. 28" />
        </div>

        <div className="space-y-1">
          <Label className="flex items-center gap-1">
            <Scale className="h-3 w-3" /> Pack Weight (g)
          </Label>
          <Input type="number" value={packWeight} onChange={(e) => setPackWeight(e.target.value)} placeholder="e.g. 143" />
        </div>
      </div>

      <Button
        onClick={predict}
        disabled={!variety || !pickTemp || !brix || loading}
        className="w-full md:w-auto"
      >
        {loading ? "Predicting..." : "Predict Shelf Life"}
      </Button>

      {prediction && (
        <div className="mt-6">
          <ShelfLifePredictionCard prediction={prediction} />
        </div>
      )}
    </div>
  );
}
