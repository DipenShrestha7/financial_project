import { useEffect, useState, useRef } from "react";
import { User, ChevronDown } from "lucide-react";
import { bankApi } from "../services/banks";

type OwnerInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
};

export default function OwnerInput({
  value,
  onChange,
  placeholder = "Account owner (e.g. Dad, Mom, Self)",
  className = "",
  required = false,
}: OwnerInputProps) {
  const [existingOwners, setExistingOwners] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bankApi
      .owners()
      .then((res) => {
        if (res.owners) {
          setExistingOwners(res.owners.filter(Boolean));
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOwners = existingOwners.filter((owner) =>
    owner.toLowerCase().includes(value.toLowerCase().trim()),
  );

  const quickSuggestions = ["Self", "Dad", "Mom", "Business"].filter(
    (s) => !existingOwners.some((o) => o.toLowerCase() === s.toLowerCase()),
  );

  return (
    <div className="relative" ref={containerRef}>
      <div className="relative flex items-center">
        <input
          required={required}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={`w-full pr-8 ${className}`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen((prev) => !prev)}
          className="absolute right-2.5 text-[#5e7473] hover:text-[#32c7aa] transition-colors"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-[#233d3a] bg-[#0b1615] p-1.5 shadow-2xl backdrop-blur-md">
          {existingOwners.length > 0 && (
            <div className="mb-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#617e7b]">
                Existing Owners
              </div>
              {filteredOwners.length > 0 ? (
                filteredOwners.map((owner) => (
                  <button
                    key={owner}
                    type="button"
                    onClick={() => {
                      onChange(owner);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-[11px] transition-colors ${
                      value.toLowerCase() === owner.toLowerCase()
                        ? "bg-[#183934] font-semibold text-[#48d2b0]"
                        : "text-[#d1dfdc] hover:bg-[#122322]"
                    }`}
                  >
                    <User size={12} className="text-[#32c7aa]" />
                    <span>{owner}</span>
                  </button>
                ))
              ) : (
                <div className="px-2 py-1 text-[11px] text-[#718582]">
                  New owner: <strong className="text-[#48d2b0]">"{value}"</strong>
                </div>
              )}
            </div>
          )}

          {quickSuggestions.length > 0 && (
            <div className="mt-1 border-t border-[#1a2d2a] pt-1.5">
              <div className="px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-[#586c6b]">
                Quick suggestions
              </div>
              <div className="flex flex-wrap gap-1 px-1 pt-1">
                {quickSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onChange(s);
                      setOpen(false);
                    }}
                    className="rounded border border-[#1f3a37] bg-[#0e1f1d] px-2 py-0.5 text-[10px] text-[#7eb5aa] hover:border-[#32c7aa] hover:text-[#52dec2] transition-colors"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
