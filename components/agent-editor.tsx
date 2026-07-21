"use client"

import { useState } from "react"
import type { Player } from "@/lib/game-script"
import { AVATAR_OPTIONS, MODEL_OPTIONS, clearOverride, saveOverride } from "@/lib/agent-store"

interface AgentEditorProps {
  player: Player
  isCustomized: boolean
  onSave: () => void
  onClose: () => void
}

export function AgentEditor({ player, isCustomized, onSave, onClose }: AgentEditorProps) {
  const [name, setName] = useState(player.name)
  const [model, setModel] = useState(player.model)
  const [avatar, setAvatar] = useState(player.avatar)

  const save = () => {
    saveOverride(player.id, { name: name.trim() || player.name, model, avatar, custom: true })
    onSave()
  }

  const reset = () => {
    clearOverride(player.id)
    onSave()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Customize agent ${player.name}`}
      onClick={onClose}
    >
      <div
        className="modal-in relative w-full max-w-sm border border-border rounded-lg bg-card shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-4">Customize agent</p>

        {/* Live preview */}
        <div className="flex items-center gap-3 border border-border rounded-md bg-secondary/40 px-3 py-2.5 mb-5">
          <img
            src={avatar || "/placeholder.svg"}
            alt=""
            className="w-11 h-11 rounded-full border border-border object-cover"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{name.trim() || player.name}</p>
            <p className="text-[10px] font-mono text-muted-foreground truncate">{model}</p>
          </div>
        </div>

        {/* Name */}
        <label className="block mb-4">
          <span className="block text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Agent name</span>
          <input
            type="text"
            value={name}
            maxLength={14}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-secondary/60 border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-seer-gold"
            placeholder={player.name}
          />
        </label>

        {/* Model */}
        <fieldset className="mb-4">
          <legend className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Model</legend>
          <div className="grid grid-cols-2 gap-1.5">
            {MODEL_OPTIONS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModel(m)}
                aria-pressed={model === m}
                className={`px-2 py-1.5 rounded-md text-[10px] font-mono border transition-colors text-left ${
                  model === m
                    ? "border-seer-gold text-seer-gold bg-seer-gold/10"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Avatar */}
        <fieldset className="mb-6">
          <legend className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Portrait</legend>
          <div className="flex gap-1.5 flex-wrap">
            {AVATAR_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAvatar(a)}
                aria-pressed={avatar === a}
                className={`rounded-full border-2 transition-colors ${
                  avatar === a ? "border-seer-gold" : "border-transparent hover:border-border"
                }`}
              >
                <img src={a || "/placeholder.svg"} alt="" className="w-10 h-10 rounded-full object-cover" />
              </button>
            ))}
          </div>
        </fieldset>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={save}
            className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-md text-xs font-semibold hover:bg-foreground/90 transition-colors"
          >
            Save agent
          </button>
          {isCustomized && (
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2.5 rounded-md text-xs border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-md text-xs border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
