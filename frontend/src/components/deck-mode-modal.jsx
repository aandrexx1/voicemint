"use client";

import React from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

/**
 * deckMode: "study" | "presentation"
 * Portal su document.body + z alto: altrimenti resta sotto la Navbar (z-[100]) e il wrapper landing (z-10).
 */
export function DeckModeModal({ open, onClose, onSelect }) {
  const { t } = useTranslation();
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="deck-mode-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label={t("deck_mode_cancel")}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/15 bg-[#111]/95 p-6 shadow-2xl">
        <h2 id="deck-mode-title" className="text-lg font-semibold text-white">
          {t("deck_mode_title")}
        </h2>
        <p className="mt-2 text-sm text-white/55">{t("deck_mode_subtitle")}</p>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => onSelect("study")}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-4 text-left transition hover:border-[#1f3dbc]/50 hover:bg-white/[0.09]"
          >
            <span className="block text-sm font-semibold text-white">{t("deck_mode_study_title")}</span>
            <span className="mt-1 block text-xs text-white/45">{t("deck_mode_study_desc")}</span>
          </button>
          <button
            type="button"
            onClick={() => onSelect("presentation")}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-4 text-left transition hover:border-[#1f3dbc]/50 hover:bg-white/[0.09]"
          >
            <span className="block text-sm font-semibold text-white">{t("deck_mode_presentation_title")}</span>
            <span className="mt-1 block text-xs text-white/45">{t("deck_mode_presentation_desc")}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl border border-white/10 py-2.5 text-sm text-white/60 hover:bg-white/5"
        >
          {t("deck_mode_cancel")}
        </button>
      </div>
    </div>,
    document.body
  );
}
