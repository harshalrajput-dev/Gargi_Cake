import { useEffect, useRef, useState } from "react";
import {
  ORDER_LANGUAGE_STORAGE_KEY,
  ORDER_LOCALES,
  ORDER_TRANSLATIONS,
  SUPPORTED_ORDER_LANGUAGES,
} from "../data/orderTranslations.js";
import { saveWhatsAppOrder } from "../services/firebase.js";

const BAKERY_WHATSAPP_NUMBER = "918849073745";

const FLAVOUR_KEYS = {
  Chocolate: "flavourChocolate",
  Vanilla: "flavourVanilla",
  Strawberry: "flavourStrawberry",
  Butterscotch: "flavourButterscotch",
  "Black Forest": "flavourBlackForest",
  "Red Velvet": "flavourRedVelvet",
  Other: "flavourOther",
};

const TYPE_KEYS = {
  Egg: "typeEgg",
  Eggless: "typeEggless",
};

const DESIGN_KEYS = {
  Normal: "designNormal",
  "Custom Design": "designCustom",
};

const AREA_KEYS = {
  limbayat: "areaLimbayat",
  dindoli: "areaDindoli",
  navagam: "areaNavagam",
  udhana3rasta: "areaUdhana",
  maharana: "areaMaharana",
  parvatpatya: "areaParvatPatia",
  punyapatya: "areaPunyaPatia",
  saradarvaja: "areaSaraDarvaja",
};

function getSavedOrderLanguage() {
  try {
    const saved = sessionStorage.getItem(ORDER_LANGUAGE_STORAGE_KEY);
    if (SUPPORTED_ORDER_LANGUAGES.includes(saved)) return saved;
  } catch (error) {
    console.warn("Order language could not be loaded:", error);
  }
  return "en";
}

function getTodayValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function buildDeliveryTimeValue(hourValue, minuteValue, meridiem) {
  if (!/^(0[1-9]|1[0-2])$/.test(hourValue)) return "";
  if (!/^\d{2}$/.test(minuteValue)) return "";

  const hourNumber = Number(hourValue);
  const minuteNumber = Number(minuteValue);
  if (minuteNumber < 0 || minuteNumber > 55 || minuteNumber % 5 !== 0) {
    return "";
  }
  if (meridiem !== "AM" && meridiem !== "PM") return "";

  const hour24 = (hourNumber % 12) + (meridiem === "PM" ? 12 : 0);
  return `${String(hour24).padStart(2, "0")}:${minuteValue}`;
}

function getTimePeriodKey(hour24) {
  if (hour24 >= 4 && hour24 < 12) return "timeMorning";
  if (hour24 >= 12 && hour24 < 16) return "timeAfternoon";
  if (hour24 >= 16 && hour24 < 21) return "timeEvening";
  return "timeNight";
}

function formatOrderDate(value, language) {
  const parts = value.split("-").map(Number);
  if (parts.length !== 3 || parts.some((part) => Number.isNaN(part))) {
    return value;
  }

  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  const formatter = new Intl.DateTimeFormat(ORDER_LOCALES[language] || "en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dateParts = formatter.formatToParts(date).reduce((result, part) => {
    if (part.type !== "literal") result[part.type] = part.value;
    return result;
  }, {});

  return `${dateParts.day} ${dateParts.month} ${dateParts.year}`;
}

function formatOrderTime(value, language) {
  const parts = value.split(":").map(Number);
  if (parts.length < 2 || parts.some((part) => Number.isNaN(part))) {
    return value;
  }

  const hour24 = parts[0];
  const minute = parts[1];
  if (hour24 < 0 || hour24 > 23 || minute < 0 || minute > 59) return value;

  const meridiem = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;
  const clockValue = `${String(hour12).padStart(2, "0")}:${String(
    minute
  ).padStart(2, "0")}`;

  if (language === "en") {
    return `${clockValue} ${meridiem}`;
  }

  const languagePack =
    ORDER_TRANSLATIONS[language] || ORDER_TRANSLATIONS.en;
  const period = languagePack[getTimePeriodKey(hour24)];
  return `${period} ${clockValue} ${languagePack.timeSuffix}`.trim();
}

function getAbsoluteImageUrl(source) {
  if (!source) return "";
  try {
    return new URL(source, window.location.href).href;
  } catch (error) {
    return source;
  }
}

function buildWhatsAppMessage(data, language, t) {
  const lines = [
    t("msgTitle"),
    "",
    t("msgCakeDetails"),
    `${t("msgCakeName")}: ${data.cake}`,
    `${t("msgCakeImage")}: ${data.imageUrl || t("msgNotProvided")}`,
    `${t("msgWeight")}: ${data.weightLabel || data.weight}`,
    `${t("msgFlavour")}: ${data.flavourLabel || data.flavour}`,
    `${t("msgCakeType")}: ${data.cakeTypeLabel || data.cakeType}`,
    `${t("msgDesign")}: ${data.designLabel || data.design}`,
    `${t("msgQuantity")}: ${data.quantity}`,
    `${t("msgProductPrice")}: ₹${data.basePrice} (${t("msgBasePriceNote")})`,
    "",
    `${t("msgCakeMessage")}: ${data.cakeMessage || t("msgNone")}`,
    `${t("msgSpecialInstructions")}: ${data.instructions || t("msgNone")}`,
    "",
    t("msgCustomerDetails"),
    `${t("msgFullName")}: ${data.name}`,
    `${t("msgMobile")}: ${data.mobile}`,
    `${t("msgEmail")}: ${data.email || t("msgNotProvided")}`,
    "",
    t("msgDeliveryDetails"),
    `${t("msgDate")}: ${formatOrderDate(data.deliveryDate, language)}`,
    `${t("msgTime")}: ${formatOrderTime(data.deliveryTime, language)}`,
    `${t("msgArea")}: ${data.area}`,
    `${t("msgAddress")}: ${data.address}`,
  ];

  if (data.gps) {
    lines.push(
      "",
      t("msgGps"),
      `${t("msgLatitude")}: ${data.gps.latitude.toFixed(6)}`,
      `${t("msgLongitude")}: ${data.gps.longitude.toFixed(6)}`,
      `${t("msgMapsLink")}: ${data.gps.mapUrl}`
    );
  }

  lines.push("", t("msgConfirm"), "", t("msgThanks"), "Gargi Cake");

  return lines.join("\n");
}

function createInitialForm() {
  return {
    custName: "",
    custMobile: "",
    custEmail: "",
    cakeWeight: "",
    cakeFlavour: "",
    cakeType: "",
    cakeDesign: "",
    cakeQuantity: "1",
    cakeMessage: "",
    specialInstructions: "",
    deliveryDate: "",
    deliveryHour: "",
    deliveryMinute: "",
    deliveryMeridiem: "",
    custArea: "",
    custAddress: "",
  };
}

export default function OrderModal({ cake, onClose }) {
  const [language, setLanguage] = useState(getSavedOrderLanguage);
  const [form, setForm] = useState(createInitialForm);
  const [errorFields, setErrorFields] = useState([]);
  const [errorMessages, setErrorMessages] = useState([]);
  const [showErrors, setShowErrors] = useState(false);
  const [detectedLocation, setDetectedLocation] = useState(null);
  const [gpsStatus, setGpsStatus] = useState({ state: "idle", errorKey: "" });
  const [gpsConsent, setGpsConsent] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

  const t = (key) => {
    const languagePack =
      ORDER_TRANSLATIONS[language] || ORDER_TRANSLATIONS.en;
    return languagePack[key] || ORDER_TRANSLATIONS.en[key] || key;
  };

  useEffect(() => {
    document.body.classList.add("modal-open");
    const frame = requestAnimationFrame(() => setIsOpen(true));

    return () => {
      cancelAnimationFrame(frame);
      document.body.classList.remove("modal-open");
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(ORDER_LANGUAGE_STORAGE_KEY, language);
    } catch (error) {
      console.warn("Order language could not be saved:", error);
    }
  }, [language]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") requestClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const requestClose = () => {
    setIsOpen(false);
    closeTimerRef.current = setTimeout(() => {
      onClose();
    }, 320);
  };

  const showToast = (message) => {
    setToastMessage(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage("");
      toastTimerRef.current = null;
    }, 6500);
  };

  const handleChange = (event) => {
    const { id, value } = event.target;
    setForm((previous) => ({ ...previous, [id]: value }));
    setErrorFields((previous) => previous.filter((field) => field !== id));
  };

  const labelFor = (kind, value) => {
    if (!value) return "";
    if (kind === "weight") {
      return value === "Custom" ? t("weightCustom") : value;
    }
    if (kind === "flavour") {
      return t(FLAVOUR_KEYS[value] || "cakeFlavour");
    }
    if (kind === "type") {
      return t(TYPE_KEYS[value] || "cakeType");
    }
    if (kind === "design") {
      return t(DESIGN_KEYS[value] || "cakeDesign");
    }
    if (kind === "area") {
      return t(AREA_KEYS[value] || "deliveryArea");
    }
    return value;
  };

  const validate = (lang, options = {}) => {
    const translate = (key) => {
      const languagePack =
        ORDER_TRANSLATIONS[lang] || ORDER_TRANSLATIONS.en;
      return languagePack[key] || ORDER_TRANSLATIONS.en[key] || key;
    };

    const errors = [];
    const fields = [];

    const fail = (fieldIds, message) => {
      fieldIds.forEach((fieldId) => {
        if (!fields.includes(fieldId)) fields.push(fieldId);
      });
      errors.push(message);
    };

    const nameValue = form.custName.trim();
    if (nameValue.length < 2) fail(["custName"], translate("errorName"));

    const mobileValue = form.custMobile.replace(/\D/g, "");
    if (!/^\d{10}$/.test(mobileValue)) {
      fail(["custMobile"], translate("errorMobile"));
    }

    const emailValue = form.custEmail.trim();
    if (emailValue && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      fail(["custEmail"], translate("errorEmail"));
    }

    if (!form.cakeWeight) fail(["cakeWeight"], translate("errorWeight"));
    if (!form.cakeFlavour) {
      fail(["cakeFlavour"], translate("errorFlavour"));
    }
    if (!form.cakeType) fail(["cakeType"], translate("errorType"));
    if (!form.cakeDesign) fail(["cakeDesign"], translate("errorDesign"));

    const quantityValue = parseInt(form.cakeQuantity, 10);
    if (
      !Number.isInteger(quantityValue) ||
      quantityValue < 1 ||
      quantityValue > 50
    ) {
      fail(["cakeQuantity"], translate("errorQuantity"));
    }

    const dateValue = form.deliveryDate;
    if (!dateValue) {
      fail(["deliveryDate"], translate("errorDateRequired"));
    } else if (dateValue < getTodayValue()) {
      fail(["deliveryDate"], translate("errorDatePast"));
    }

    const hourValue = form.deliveryHour;
    const minuteValue = form.deliveryMinute;
    const meridiemValue = form.deliveryMeridiem;
    const minuteNumber = Number(minuteValue);
    const validTime =
      /^(0[1-9]|1[0-2])$/.test(hourValue) &&
      /^\d{2}$/.test(minuteValue) &&
      minuteNumber >= 0 &&
      minuteNumber <= 55 &&
      minuteNumber % 5 === 0 &&
      (meridiemValue === "AM" || meridiemValue === "PM");

    const timeFields = [
      "deliveryHour",
      "deliveryMinute",
      "deliveryMeridiem",
    ];

    if (!hourValue || !minuteValue || !meridiemValue) {
      fail(timeFields, translate("errorTime"));
    } else if (!validTime) {
      fail(timeFields, translate("errorTimeInvalid"));
    }

    if (!form.custArea) fail(["custArea"], translate("errorArea"));

    const addressValue = form.custAddress.trim();
    if (addressValue.length < 5) {
      fail(["custAddress"], translate("errorAddress"));
    }

    if (errors.length > 0) {
      setErrorFields(fields);
      setErrorMessages(errors);
      setShowErrors(true);

      if (options.focus !== false) {
        const firstField = document.getElementById(fields[0]);
        if (firstField) {
          firstField.focus({ preventScroll: true });
          firstField.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }

      return { valid: false };
    }

    setErrorFields([]);
    setErrorMessages([]);
    setShowErrors(false);

    const deliveryTime = buildDeliveryTimeValue(
      hourValue,
      minuteValue,
      meridiemValue
    );

    return {
      valid: true,
      data: {
        name: nameValue,
        mobile: mobileValue,
        email: emailValue,
        cake: cake.title,
        basePrice: cake.price,
        weight: form.cakeWeight,
        weightLabel: labelFor("weight", form.cakeWeight),
        flavour: form.cakeFlavour,
        flavourLabel: labelFor("flavour", form.cakeFlavour),
        cakeType: form.cakeType,
        cakeTypeLabel: labelFor("type", form.cakeType),
        design: form.cakeDesign,
        designLabel: labelFor("design", form.cakeDesign),
        quantity: quantityValue,
        cakeMessage: form.cakeMessage.trim(),
        instructions: form.specialInstructions.trim(),
        deliveryDate: dateValue,
        deliveryTime,
        deliveryTimeLabel: formatOrderTime(deliveryTime, lang),
        deliveryHour: hourValue,
        deliveryMinute: minuteValue,
        deliveryMeridiem: meridiemValue,
        area: labelFor("area", form.custArea),
        areaCode: form.custArea,
        address: addressValue,
        image: cake.image,
      },
    };
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const result = validate(language);
    if (!result.valid) return;

    const data = result.data;
    data.imageUrl = getAbsoluteImageUrl(data.image);

    if (detectedLocation && gpsConsent) {
      data.gps = { ...detectedLocation };
    }

    const message = buildWhatsAppMessage(data, language, t);
    const whatsappUrl = `https://wa.me/${BAKERY_WHATSAPP_NUMBER}?text=${encodeURIComponent(
      message
    )}`;

    const whatsappLink = document.createElement("a");
    whatsappLink.href = whatsappUrl;
    whatsappLink.target = "_blank";
    whatsappLink.rel = "noopener";
    document.body.appendChild(whatsappLink);
    whatsappLink.click();
    whatsappLink.remove();

    const orderPayload = {
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      area: data.areaCode,
      areaLabel: data.area,
      address: data.address,
      cake: data.cake,
      price: "₹" + data.basePrice,
      basePrice: data.basePrice,
      weight: data.weight,
      weightLabel: data.weightLabel,
      flavour: data.flavour,
      flavourLabel: data.flavourLabel,
      cakeType: data.cakeType,
      cakeTypeLabel: data.cakeTypeLabel,
      design: data.design,
      designLabel: data.designLabel,
      quantity: data.quantity,
      cakeMessage: data.cakeMessage,
      instructions: data.instructions,
      deliveryDate: data.deliveryDate,
      deliveryTime: data.deliveryTime,
      deliveryTimeLabel: data.deliveryTimeLabel,
      cakeImage: data.imageUrl,
      language,
      orderChannel: "WhatsApp",
      status: "WhatsApp Opened",
      confirmed: false,
    };

    saveWhatsAppOrder(orderPayload).catch((error) => {
      console.warn("Order log could not be saved:", error);
    });

    showToast(t("toastWhatsAppOpened"));
  };

  const handleLanguageChange = (nextLanguage) => {
    if (!SUPPORTED_ORDER_LANGUAGES.includes(nextLanguage)) return;
    setLanguage(nextLanguage);
    if (showErrors) validate(nextLanguage, { focus: false });
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      setDetectedLocation(null);
      setGpsStatus({ state: "error", errorKey: "gpsUnsupported" });
      return;
    }

    setDetectedLocation(null);
    setGpsConsent(false);
    setGpsStatus({ state: "loading", errorKey: "" });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const accuracy = position.coords.accuracy;

        setDetectedLocation({
          latitude,
          longitude,
          accuracy,
          mapUrl: `https://www.google.com/maps?q=${latitude},${longitude}`,
        });
        setGpsStatus({ state: "success", errorKey: "" });
      },
      (error) => {
        let errorKey = "gpsGenericError";

        if (error && error.code === 1) errorKey = "gpsDenied";
        else if (error && error.code === 2) errorKey = "gpsUnavailable";
        else if (error && error.code === 3) errorKey = "gpsTimeout";

        setDetectedLocation(null);
        setGpsStatus({ state: "error", errorKey });
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const clearDetectedLocation = () => {
    setDetectedLocation(null);
    setGpsConsent(false);
    setGpsStatus({ state: "idle", errorKey: "" });
  };

  const shareCakeImage = async () => {
    const absoluteImage = getAbsoluteImageUrl(cake.image);
    if (!absoluteImage) {
      showToast(t("toastSelectCake"));
      return;
    }

    const title = cake.title || "Gargi Cake";
    const text = `${title} — Gargi Cake`;

    try {
      if (navigator.share) {
        try {
          const response = await fetch(absoluteImage, { mode: "cors" });
          if (response.ok) {
            const blob = await response.blob();
            if (blob.type.startsWith("image/")) {
              const extension = (blob.type.split("/")[1] || "jpg").replace(
                "jpeg",
                "jpg"
              );
              const file = new File([blob], `gargi-cake.${extension}`, {
                type: blob.type,
              });

              if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file], title, text });
                return;
              }
            }
          }
        } catch (error) {
          console.warn(
            "Could not prepare the image file for sharing:",
            error
          );
        }

        await navigator.share({ title, text, url: absoluteImage });
        return;
      }
    } catch (error) {
      if (error && error.name === "AbortError") return;
      console.warn("Share failed:", error);
    }

    window.open(absoluteImage, "_blank", "noopener");
  };

  const isGpsLoading = gpsStatus.state === "loading";
  const isGpsSuccess =
    gpsStatus.state === "success" && Boolean(detectedLocation);

  const fieldClass = (fieldId) =>
    `form-group${errorFields.includes(fieldId) ? " has-error" : ""}`;

  const inputClass = (fieldId) =>
    errorFields.includes(fieldId) ? "input-error" : "";

  return (
    <div
      id="orderModal"
      className={`modal order-modal is-visible${isOpen ? " is-open" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="orderModalTitle"
      lang={language}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose();
      }}
    >
      <div className="modal-content whatsapp-order-content">
        <button
          type="button"
          className="order-close-btn"
          onClick={requestClose}
          aria-label="Close order form"
        >
          &times;
        </button>

        <div className="order-modal-header">
          <span className="order-eyebrow">{t("eyebrow")}</span>
          <h2 id="orderModalTitle">{t("modalTitle")}</h2>
          <p>{t("modalSubtitle")}</p>

          <div
            className="order-language-bar"
            role="group"
            aria-labelledby="orderLanguageLabel"
          >
            <span className="language-label" id="orderLanguageLabel">
              {t("language")}
            </span>
            <div className="language-options">
              <button
                type="button"
                className={`language-btn${
                  language === "en" ? " is-active" : ""
                }`}
                onClick={() => handleLanguageChange("en")}
                aria-pressed={language === "en"}
              >
                English <span aria-hidden="true">🇬🇧</span>
              </button>
              <button
                type="button"
                className={`language-btn${
                  language === "gu" ? " is-active" : ""
                }`}
                onClick={() => handleLanguageChange("gu")}
                aria-pressed={language === "gu"}
              >
                ગુજરાતી <span aria-hidden="true">🇮🇳</span>
              </button>
              <button
                type="button"
                className={`language-btn${
                  language === "hi" ? " is-active" : ""
                }`}
                onClick={() => handleLanguageChange("hi")}
                aria-pressed={language === "hi"}
              >
                हिंदी <span aria-hidden="true">🇮🇳</span>
              </button>
            </div>
          </div>
        </div>

        <div className="order-product-preview">
          <div className="order-product-image-wrap">
            <img src={cake.image} alt={cake.title} />
          </div>
          <div className="order-product-meta">
            <span className="preview-label">{t("selectedCake")}</span>
            <h3>{cake.title}</h3>
            <div className="preview-price-row">
              <span className="preview-price">₹{cake.price}</span>
              <span className="preview-price-note">
                {t("originalProductPrice")}
              </span>
            </div>
          </div>
        </div>

        <form id="cakeOrderForm" noValidate onSubmit={handleSubmit}>
          <div
            id="orderFormError"
            className={`form-error${showErrors ? " show" : ""}`}
            role="alert"
          >
            {errorMessages.map((message) => `• ${message}`).join("\n")}
          </div>

          <div className="order-section-title">
            {t("customerInformation")}
          </div>
          <div className="form-grid">
            <div className={fieldClass("custName")}>
              <label htmlFor="custName">
                {t("fullName")} <span className="required-mark">*</span>
              </label>
              <input
                type="text"
                id="custName"
                name="custName"
                autoComplete="name"
                placeholder={t("fullNamePlaceholder")}
                value={form.custName}
                onChange={handleChange}
                className={inputClass("custName")}
                required
              />
            </div>

            <div className={fieldClass("custMobile")}>
              <label htmlFor="custMobile">
                {t("mobileNumber")} <span className="required-mark">*</span>
              </label>
              <input
                type="tel"
                id="custMobile"
                name="custMobile"
                inputMode="numeric"
                maxLength={10}
                autoComplete="tel"
                placeholder={t("mobilePlaceholder")}
                value={form.custMobile}
                onChange={handleChange}
                className={inputClass("custMobile")}
                required
              />
            </div>

            <div className={`${fieldClass("custEmail")} full`}>
              <label htmlFor="custEmail">
                {t("emailAddress")}{" "}
                <span className="optional-mark">{t("optional")}</span>
              </label>
              <input
                type="email"
                id="custEmail"
                name="custEmail"
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                value={form.custEmail}
                onChange={handleChange}
                className={inputClass("custEmail")}
              />
            </div>
          </div>

          <div className="order-section-title">{t("cakeInformation")}</div>
          <div className="form-grid">
            <div className={fieldClass("cakeWeight")}>
              <label htmlFor="cakeWeight">
                {t("cakeWeight")} <span className="required-mark">*</span>
              </label>
              <select
                id="cakeWeight"
                name="cakeWeight"
                value={form.cakeWeight}
                onChange={handleChange}
                className={inputClass("cakeWeight")}
                required
              >
                <option value="">{t("selectWeight")}</option>
                <option value="0.5 KG">0.5 KG</option>
                <option value="1 KG">1 KG</option>
                <option value="1.5 KG">1.5 KG</option>
                <option value="2 KG">2 KG</option>
                <option value="3 KG">3 KG</option>
                <option value="Custom">{t("weightCustom")}</option>
              </select>
            </div>

            <div className={fieldClass("cakeFlavour")}>
              <label htmlFor="cakeFlavour">
                {t("cakeFlavour")} <span className="required-mark">*</span>
              </label>
              <select
                id="cakeFlavour"
                name="cakeFlavour"
                value={form.cakeFlavour}
                onChange={handleChange}
                className={inputClass("cakeFlavour")}
                required
              >
                <option value="">{t("selectFlavour")}</option>
                <option value="Chocolate">{t("flavourChocolate")}</option>
                <option value="Vanilla">{t("flavourVanilla")}</option>
                <option value="Strawberry">{t("flavourStrawberry")}</option>
                <option value="Butterscotch">
                  {t("flavourButterscotch")}
                </option>
                <option value="Black Forest">
                  {t("flavourBlackForest")}
                </option>
                <option value="Red Velvet">{t("flavourRedVelvet")}</option>
                <option value="Other">{t("flavourOther")}</option>
              </select>
            </div>

            <div className={fieldClass("cakeType")}>
              <label htmlFor="cakeType">
                {t("cakeType")} <span className="required-mark">*</span>
              </label>
              <select
                id="cakeType"
                name="cakeType"
                value={form.cakeType}
                onChange={handleChange}
                className={inputClass("cakeType")}
                required
              >
                <option value="">{t("selectType")}</option>
                <option value="Egg">{t("typeEgg")}</option>
                <option value="Eggless">{t("typeEggless")}</option>
              </select>
            </div>

            <div className={fieldClass("cakeDesign")}>
              <label htmlFor="cakeDesign">
                {t("cakeDesign")} <span className="required-mark">*</span>
              </label>
              <select
                id="cakeDesign"
                name="cakeDesign"
                value={form.cakeDesign}
                onChange={handleChange}
                className={inputClass("cakeDesign")}
                required
              >
                <option value="">{t("selectDesign")}</option>
                <option value="Normal">{t("designNormal")}</option>
                <option value="Custom Design">{t("designCustom")}</option>
              </select>
            </div>

            <div className={fieldClass("cakeQuantity")}>
              <label htmlFor="cakeQuantity">
                {t("quantity")} <span className="required-mark">*</span>
              </label>
              <input
                type="number"
                id="cakeQuantity"
                name="cakeQuantity"
                min="1"
                max="50"
                value={form.cakeQuantity}
                onChange={handleChange}
                className={inputClass("cakeQuantity")}
                required
              />
            </div>

            <div className={fieldClass("cakeMessage")}>
              <label htmlFor="cakeMessage">{t("cakeMessage")}</label>
              <input
                type="text"
                id="cakeMessage"
                name="cakeMessage"
                maxLength={80}
                placeholder={t("cakeMessagePlaceholder")}
                value={form.cakeMessage}
                onChange={handleChange}
                className={inputClass("cakeMessage")}
              />
            </div>

            <div className={`${fieldClass("specialInstructions")} full`}>
              <label htmlFor="specialInstructions">
                {t("specialInstructions")}
              </label>
              <textarea
                id="specialInstructions"
                name="specialInstructions"
                rows="3"
                maxLength={500}
                placeholder={t("specialInstructionsPlaceholder")}
                value={form.specialInstructions}
                onChange={handleChange}
                className={inputClass("specialInstructions")}
              />
            </div>
          </div>

          <div className="order-section-title">
            {t("deliveryInformation")}
          </div>
          <div className="form-grid">
            <div className={fieldClass("deliveryDate")}>
              <label htmlFor="deliveryDate">
                {t("deliveryDate")} <span className="required-mark">*</span>
              </label>
              <input
                type="date"
                id="deliveryDate"
                name="deliveryDate"
                min={getTodayValue()}
                value={form.deliveryDate}
                onChange={handleChange}
                className={inputClass("deliveryDate")}
                required
              />
            </div>

            <div className={fieldClass("deliveryHour")}>
              <label htmlFor="deliveryHour">
                {t("deliveryTime")} <span className="required-mark">*</span>
              </label>
              <div className="time-picker" role="group" aria-label="Delivery time">
                <select
                  id="deliveryHour"
                  name="deliveryHour"
                  aria-label="Delivery hour"
                  value={form.deliveryHour}
                  onChange={handleChange}
                  className={inputClass("deliveryHour")}
                  required
                >
                  <option value="">{t("selectHour")}</option>
                  {Array.from({ length: 12 }, (_, index) =>
                    String(index + 1).padStart(2, "0")
                  ).map((hour) => (
                    <option key={hour} value={hour}>
                      {hour}
                    </option>
                  ))}
                </select>
                <span className="time-separator" aria-hidden="true">
                  :
                </span>
                <select
                  id="deliveryMinute"
                  name="deliveryMinute"
                  aria-label="Delivery minute"
                  value={form.deliveryMinute}
                  onChange={handleChange}
                  className={inputClass("deliveryMinute")}
                  required
                >
                  <option value="">{t("selectMinute")}</option>
                  {Array.from({ length: 12 }, (_, index) =>
                    String(index * 5).padStart(2, "0")
                  ).map((minute) => (
                    <option key={minute} value={minute}>
                      {minute}
                    </option>
                  ))}
                </select>
                <select
                  id="deliveryMeridiem"
                  name="deliveryMeridiem"
                  aria-label="AM or PM"
                  value={form.deliveryMeridiem}
                  onChange={handleChange}
                  className={inputClass("deliveryMeridiem")}
                  required
                >
                  <option value="">{t("selectPeriod")}</option>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
              <p className="time-helper">{t("timeHelper")}</p>
            </div>

            <div className={`${fieldClass("custArea")} full`}>
              <label htmlFor="custArea">
                {t("deliveryArea")} <span className="required-mark">*</span>{" "}
                <span className="optional-mark">
                  {t("deliveryAreaOnly")}
                </span>
              </label>
              <select
                id="custArea"
                name="custArea"
                value={form.custArea}
                onChange={handleChange}
                className={inputClass("custArea")}
                required
              >
                <option value="">{t("chooseArea")}</option>
                {Object.entries(AREA_KEYS).map(([value, key]) => (
                  <option key={value} value={value}>
                    {t(key)}
                  </option>
                ))}
              </select>
            </div>

            <div className={`${fieldClass("custAddress")} full`}>
              <label htmlFor="custAddress">
                {t("completeAddress")}{" "}
                <span className="required-mark">*</span>
              </label>
              <textarea
                id="custAddress"
                name="custAddress"
                rows="3"
                autoComplete="street-address"
                placeholder={t("addressPlaceholder")}
                value={form.custAddress}
                onChange={handleChange}
                className={inputClass("custAddress")}
                required
              />
            </div>

            <div className="form-group full gps-card">
              <div className="gps-card-header">
                <div className="gps-pin" aria-hidden="true">
                  📍
                </div>
                <div>
                  <h3>{t("gpsHeading")}</h3>
                  <p>{t("gpsDescription")}</p>
                </div>
              </div>

              <div className="gps-actions">
                {!isGpsSuccess && (
                  <button
                    type="button"
                    id="gpsDetectBtn"
                    className="btn-gps-detect"
                    onClick={detectCurrentLocation}
                    disabled={isGpsLoading}
                  >
                    <span aria-hidden="true">📍</span>
                    <span>
                      {isGpsLoading ? t("gpsDetecting") : t("gpsDetect")}
                    </span>
                  </button>
                )}
                {isGpsSuccess && (
                  <>
                    <button
                      type="button"
                      id="gpsRefreshBtn"
                      className="btn-gps-refresh"
                      onClick={detectCurrentLocation}
                    >
                      <span aria-hidden="true">🔄</span>
                      <span>{t("gpsRefresh")}</span>
                    </button>
                    <button
                      type="button"
                      id="gpsClearBtn"
                      className="btn-gps-clear"
                      onClick={clearDetectedLocation}
                    >
                      <span aria-hidden="true">✕</span>
                      <span>{t("gpsRemove")}</span>
                    </button>
                  </>
                )}
              </div>

              <p
                id="gpsStatus"
                className={`gps-status${
                  isGpsLoading
                    ? " is-loading"
                    : gpsStatus.state === "error"
                    ? " is-error"
                    : ""
                }`}
                role="status"
                aria-live="polite"
              >
                {isGpsLoading
                  ? t("gpsDetecting")
                  : gpsStatus.state === "error"
                  ? t(gpsStatus.errorKey || "gpsGenericError")
                  : ""}
              </p>

              {isGpsSuccess && (
                <div id="gpsResult" className="gps-result">
                  <div className="gps-result-info">
                    <strong>{t("gpsDetected")}</strong>
                    <span id="gpsCoords">
                      {t("gpsCoordinates")}:{" "}
                      {detectedLocation.latitude.toFixed(6)},{" "}
                      {detectedLocation.longitude.toFixed(6)} ·{" "}
                      {t("gpsAccuracy")}: ±
                      {Math.round(Number(detectedLocation.accuracy) || 0)} m
                    </span>
                  </div>
                  <a
                    id="gpsMapLink"
                    className="btn-gps-map"
                    href={detectedLocation.mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span aria-hidden="true">🗺️</span>
                    <span>{t("gpsOpenMaps")}</span>
                  </a>
                </div>
              )}

              {isGpsSuccess && (
                <label className="gps-consent" id="gpsConsentWrap">
                  <input
                    type="checkbox"
                    id="gpsIncludeConsent"
                    checked={gpsConsent}
                    onChange={(event) => setGpsConsent(event.target.checked)}
                  />
                  <span>{t("gpsConsent")}</span>
                </label>
              )}
            </div>
          </div>

          <div className="order-price-panel">
            <div>
              <span className="price-panel-label">{t("productPrice")}</span>
              <strong>₹{cake.price}</strong>
            </div>
            <p>{t("finalPriceNote")}</p>
          </div>

          <div className="order-actions">
            <button type="submit" className="btn-whatsapp-order">
              <span className="wa-icon" aria-hidden="true">
                ✆
              </span>
              <span>{t("sendWhatsApp")}</span>
            </button>

            <div className="order-secondary-actions">
              <a href="tel:+918849073745" className="btn-call-bakery">
                <span aria-hidden="true">📞</span>
                <span>{t("callBakery")}</span>
              </a>
              <button
                type="button"
                className="btn-share-image"
                onClick={shareCakeImage}
              >
                <span aria-hidden="true">📤</span>
                <span>{t("shareCakeImage")}</span>
              </button>
            </div>

            <p className="image-share-note">{t("imageShareNote")}</p>
          </div>
        </form>
      </div>

      <div
        id="orderToast"
        className={`order-toast${toastMessage ? " show" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toastMessage}
      </div>
    </div>
  );
}
