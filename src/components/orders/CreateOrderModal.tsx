"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { WILAYAS } from "@/constants/wilayas";
import { toast } from "sonner";

interface CreateOrderModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateOrderModal({ open, onClose, onCreated }: CreateOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    wilaya_code: "16",
    commune: "",
    address: "",
    product_name: "",
    quantity: "1",
    unit_price: "",
    source: "manual",
    notes: "",
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        wilaya_code: parseInt(form.wilaya_code),
        quantity: parseInt(form.quantity),
        unit_price: parseFloat(form.unit_price),
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(json.error ?? "Erreur lors de la création");
      return;
    }

    toast.success("Commande créée avec succès");
    onCreated();
    onClose();
    setForm({
      customer_name: "", customer_phone: "", wilaya_code: "16",
      commune: "", address: "", product_name: "", quantity: "1",
      unit_price: "", source: "manual", notes: "",
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nouvelle commande"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button form="create-order-form" type="submit" loading={loading}>Créer</Button>
        </>
      }
    >
      <form id="create-order-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Nom du client"
            value={form.customer_name}
            onChange={(e) => handleChange("customer_name", e.target.value)}
            required
            placeholder="Ahmed Benali"
          />
          <Input
            label="Téléphone"
            value={form.customer_phone}
            onChange={(e) => handleChange("customer_phone", e.target.value)}
            required
            placeholder="0555 123 456"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Wilaya"
            value={form.wilaya_code}
            onChange={(e) => handleChange("wilaya_code", e.target.value)}
          >
            {WILAYAS.map((w) => (
              <option key={w.code} value={w.code}>
                {w.code} - {w.name}
              </option>
            ))}
          </Select>
          <Input
            label="Commune"
            value={form.commune}
            onChange={(e) => handleChange("commune", e.target.value)}
            placeholder="Bab El Oued"
          />
        </div>

        <Input
          label="Adresse"
          value={form.address}
          onChange={(e) => handleChange("address", e.target.value)}
          placeholder="Rue, cité..."
        />

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <Input
              label="Produit"
              value={form.product_name}
              onChange={(e) => handleChange("product_name", e.target.value)}
              required
              placeholder="Nom du produit"
              className="col-span-2"
            />
          </div>
          <Input
            label="Quantité"
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => handleChange("quantity", e.target.value)}
            required
          />
          <Input
            label="Prix unitaire (DA)"
            type="number"
            min="0"
            step="0.01"
            value={form.unit_price}
            onChange={(e) => handleChange("unit_price", e.target.value)}
            required
            placeholder="2500"
          />
        </div>

        <Select
          label="Source"
          value={form.source}
          onChange={(e) => handleChange("source", e.target.value)}
        >
          <option value="manual">Manuel</option>
          <option value="instagram">Instagram</option>
          <option value="messenger">Messenger</option>
          <option value="shopify">Shopify</option>
          <option value="woocommerce">WooCommerce</option>
          <option value="google_sheets">Google Sheets</option>
        </Select>

        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="Notes internes..."
          rows={2}
        />
      </form>
    </Modal>
  );
}
