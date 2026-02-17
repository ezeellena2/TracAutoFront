
import React, { useEffect, useMemo, useState } from "react";
import { usePhoneInput, defaultCountries } from "react-international-phone";
import { parsePhoneNumberFromString } from "libphonenumber-js/max";
import { useTranslation } from "react-i18next";
import { Select } from "./Select";
import "react-international-phone/style.css";

interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
  onChange?: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: string } }
  ) => void;
}

export function Input({
  label,
  error,
  helperText,
  className = "",
  id,
  type,
  name,
  onChange,
  rightElement,
  ...props
}: InputProps & { rightElement?: React.ReactNode }) {
  const { t } = useTranslation();

  const inputId =
    id ||
    (typeof label === "string"
      ? label.toLowerCase().replace(/\s/g, "-")
      : undefined);

  function getE164IfMobile(raw: string, iso2: string) {
    const region = (iso2 ?? "AR").toUpperCase() as any;

    const p = raw.trim().startsWith("+")
      ? parsePhoneNumberFromString(raw.trim())
      : parsePhoneNumberFromString(raw.trim(), region);

    if (!p || !p.isValid()) return { e164: "", ok: false, msg: t("auth.invalidPhone") };

    const type = p.getType();

    // Si es MOVILE, todo ok.
    if (type === "MOBILE") {
      return { e164: p.number, ok: true, msg: "" };
    }

    // Si es LÍNEA FIJA o "FIXED_LINE_OR_MOBILE" (común en AR si falta el 9)
    if (type === "FIXED_LINE" || type === "FIXED_LINE_OR_MOBILE") {
      // Caso especial Argentina: convertir a móvil agregando 9
      if (p.country === "AR" && !p.number.startsWith("+549")) {
        // p.number es E.164 (+5411...) -> lo transformamos a +54 9 11...
        const e164Mobile = p.number.replace("+54", "+549");
        return { e164: e164Mobile, ok: true, msg: "" }; // Retornamos modificado
      }
      // Si es otro país o ya tiene el formato, lo mandamos como venga
      return { e164: p.number, ok: true, msg: "" };
    }

    return { e164: "", ok: false, msg: t("auth.whatsappRequired") };
  }

  if (type === "tel") {
    const [phoneUI, setPhoneUI] = useState<string>("");

    useEffect(() => {
      if (typeof props.value === "string" && props.value !== phoneUI) {
        setPhoneUI(props.value);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.value]);

    const countriesForPhoneInput = useMemo(
      () =>
        defaultCountries.map((c) => {
          return [
            c[0], // name
            c[1], // iso2
            c[2], // dialCode
            "... ... .... .... ",
          ];
        }) as any[],
      []
    );

    const {
      inputValue,
      handlePhoneValueChange,
      inputRef,
      country,
      setCountry,
    } = usePhoneInput({
      defaultCountry: "ar",
      value: phoneUI,
      countries: countriesForPhoneInput,
      onChange: (data) => {
        setPhoneUI(data.phone);
      },
      forceDialCode: true,
    });

    const commitE164 = () => {
      if (!onChange) return;

      const { e164, ok } = getE164IfMobile(inputValue, country?.iso2 || "AR");

      if (!ok) {
        onChange({ target: { name: name || "", value: "" } });
        return;
      }

      onChange({ target: { name: name || "", value: e164 } });
    };


    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-text mb-1.5"
          >
            {label}
          </label>
        )}

        <div className={`flex gap-2 ${error ? "phone-input-error" : ""}`}>
          <div className="w-[80px] shrink-0">
            <Select
              options={defaultCountries.map((c) => ({
                value: c[1],
                label: (
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://flagcdn.com/w20/${c[1]}.png`}
                      srcSet={`https://flagcdn.com/w40/${c[1]}.png 2x`}
                      width="20"
                      height="15"
                      alt={c[0]}
                      style={{ objectFit: "contain" }}
                    />
                    <span className="text-sm truncate">{c[0]}</span>
                  </div>
                ),
                triggerLabel: (
                  <div className="flex items-center">
                    <img
                      src={`https://flagcdn.com/w20/${c[1]}.png`}
                      srcSet={`https://flagcdn.com/w40/${c[1]}.png 2x`}
                      width="20"
                      height="15"
                      alt={c[0]}
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                ),
              }))}
              value={country.iso2}
              onChange={(val) => setCountry(val as string)}
              disabled={props.disabled}
              buttonClassName="h-10"
              dropdownClassName="w-[280px]"
            />
          </div>

          <input
            {...props}
            ref={inputRef}
            id={inputId}
            name={name}
            value={inputValue}
            onChange={handlePhoneValueChange}
            onBlur={(e) => {
              commitE164();
              props.onBlur?.(e);
            }}
            type="tel"
            className={`
              w-full px-4 py-2 rounded-lg 
              bg-surface border border-border 
              text-text placeholder-text-muted
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? "border-error focus:ring-error" : ""}
              h-10
              ${className}
            `}
            disabled={props.disabled}
            placeholder={props.placeholder}
          />
        </div>

        {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-text-muted">{helperText}</p>
        )}
      </div>
    );
  }
  //INPUTS POR DEFECTO
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type={type}
          name={name}
          className={`
            w-full px-4 py-2 rounded-lg 
            bg-surface border border-border 
            text-text placeholder-text-muted
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-error focus:ring-error' : ''}
            ${rightElement ? 'pr-10' : ''}
            ${className}
          `}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement>}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-error">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-text-muted">{helperText}</p>
      )}
    </div>
  );
}
