import React, { useEffect, useMemo, useState, useRef } from "react";
import { usePhoneInput, defaultCountries } from "react-international-phone";
import { parsePhoneNumberFromString, CountryCode } from "libphonenumber-js/max";
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

type InputComponentProps = InputProps & { rightElement?: React.ReactNode };

function getInputId(label: React.ReactNode, id?: string) {
  return (
    id ||
    (typeof label === "string"
      ? label.toLowerCase().replace(/\s/g, "-")
      : undefined)
  );
}

function getE164IfMobile(
  raw: string,
  iso2: string,
  t: (key: string) => string
) {
  const region = (iso2 ?? "AR").toUpperCase() as CountryCode;

  const p = raw.trim().startsWith("+")
    ? parsePhoneNumberFromString(raw.trim())
    : parsePhoneNumberFromString(raw.trim(), region);

  if (!p || !p.isValid()) return { e164: "", ok: false, msg: t("auth.invalidPhone") };

  const type = p.getType();

  // Si es MOVILE, todo ok.
  if (type === "MOBILE") {
    return { e164: p.number, ok: true, msg: "" };
  }

  // Si es LINEA FIJA o "FIXED_LINE_OR_MOBILE" (comun en AR si falta el 9)
  if (type === "FIXED_LINE" || type === "FIXED_LINE_OR_MOBILE") {
    // Caso especial Argentina: convertir a movil agregando 9
    if (p.country === "AR" && !p.number.startsWith("+549")) {
      // p.number es E.164 (+5411...) -> lo transformamos a +54 9 11...
      const e164Mobile = p.number.replace("+54", "+549");
      return { e164: e164Mobile, ok: true, msg: "" };
    }
    return { e164: p.number, ok: true, msg: "" };
  }

  return { e164: "", ok: false, msg: t("auth.whatsappRequired") };
}

function PhoneInput({
  label,
  error,
  helperText,
  className = "",
  id,
  name,
  onChange,
  rightElement,
  ...props
}: InputComponentProps) {
  const { t } = useTranslation();
  const inputId = getInputId(label, id);
  const [phoneUI, setPhoneUI] = useState<string>(typeof props.value === "string" ? props.value : "");
  const countries = defaultCountries as Array<[string, string, string, ...unknown[]]>;
  const prevValueRef = useRef(props.value);
  const [isEditing, setIsEditing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof props.value === "string" && props.value !== prevValueRef.current) {
      setPhoneUI(props.value);
    }
    prevValueRef.current = props.value;
  }, [props.value]);


  const countriesPermissive = useMemo(
    () =>
      countries.map(
        (c) =>
          [c[0], c[1], c[2], "...................."] as [string, string, string, string]
      ),
    [countries]
  );

  const { inputValue, handlePhoneValueChange, inputRef, country, setCountry } =
    usePhoneInput({
      defaultCountry: "ar",
      value: phoneUI,
      countries: countriesPermissive,
      disableFormatting: true,
      onChange: (data: { phone: string }) => {
        // Solo actualizamos si el valor realmente cambió para evitar bucles o prefijos automáticos
        if (data.phone !== phoneUI) {
          setPhoneUI(data.phone);
          if (onChange) {
            onChange({ target: { name: name || "", value: data.phone } });
          }
        }
      },
      forceDialCode: true,
    });

  const commitE164 = () => {
    if (!onChange) return;

    const digitsOnly = inputValue.replace(/\D/g, "");
    const dialCode = country?.dialCode || "";

    // Si el usuario no escribió nada (solo está el dialCode o está vacío), enviamos vacío
    if (!digitsOnly || digitsOnly === dialCode) {
      setLocalError(null);
      onChange({ target: { name: name || "", value: "" } });
      return;
    }

    const { e164, ok, msg } = getE164IfMobile(inputValue, country?.iso2 || "AR", t);

    if (!ok) {
      setLocalError(msg || t("auth.invalidPhone"));
      return;
    }

    setLocalError(null);
    onChange({ target: { name: name || "", value: e164 } });
  };

  const displayValue = useMemo(() => {
    if (isEditing) return inputValue;

    // Si no se está editando y el valor es solo el prefijo o está vacío,
    // devolvemos cadena vacía para que se vea el placeholder.
    const digitsOnly = inputValue.replace(/\D/g, "");
    const dialCodeDigits = (country?.dialCode || "").replace(/\D/g, "");

    if (digitsOnly === dialCodeDigits || digitsOnly === "") {
      return "";
    }

    const parsed = parsePhoneNumberFromString(inputValue);
    if (parsed?.isValid()) return parsed.format("INTERNATIONAL");
    return inputValue;
  }, [isEditing, inputValue, country]);


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

      <div className={`flex gap-2 ${error || localError ? "phone-input-error" : ""}`}>
        <div className="w-[80px] shrink-0">
          <Select
            options={countries.map((c) => ({
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
            usePortal
          />
        </div>

        <div className="relative w-full">
          <input
            {...props}
            ref={inputRef}
            id={inputId}
            name={name}
            value={displayValue}
            onChange={(e) => {
              handlePhoneValueChange(e);
            }}
            onFocus={(e) => {
              setIsEditing(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsEditing(false);
              commitE164();
              props.onBlur?.(e);
            }}
            type="tel"
            className={`
              w-full px-4 py-2 rounded-lg 
              bg-surface border border-border 
              text-text placeholder-text-muted
              focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error || localError ? "border-error focus:ring-error" : ""}
              ${rightElement ? "pr-10" : ""}
              h-10
              ${className}
            `}
            disabled={props.disabled}
            placeholder={props.placeholder}
          />
          {rightElement && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>
      </div>

      {(error || localError) && <p className="mt-1.5 text-sm text-error">{error || localError}</p>}
      {helperText && !error && !localError && (
        <p className="mt-1.5 text-sm text-text-muted">{helperText}</p>
      )}
    </div>
  );
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
}: InputComponentProps) {
  const inputId = getInputId(label, id);

  if (type === "tel") {
    return (
      <PhoneInput
        label={label}
        error={error}
        helperText={helperText}
        className={className}
        id={id}
        type={type}
        name={name}
        onChange={onChange}
        rightElement={rightElement}
        {...props}
      />
    );
  }

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
            focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary
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
