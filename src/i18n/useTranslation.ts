// src/i18n/useTranslation.ts
// ─── Instant UI translations (pre-built) + Groq for dynamic content ───────────
import { useState, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "https://agrichain-api-tnhz.onrender.com";

export const LANGUAGES = [
  { code: "english",  native: "English",  flag: "🇬🇧" },
  { code: "tamil",    native: "தமிழ்",    flag: "🇮🇳" },
  { code: "hindi",    native: "हिंदी",    flag: "🇮🇳" },
  { code: "kannada",  native: "ಕನ್ನಡ",    flag: "🇮🇳" },
  { code: "telugu",   native: "తెలుగు",   flag: "🇮🇳" },
  { code: "marathi",  native: "मराठी",    flag: "🇮🇳" },
  { code: "gujarati", native: "ગુજરાતી",  flag: "🇮🇳" },
];

// ── Complete pre-built translations — INSTANT, no API call ────────────────────
const UI_TRANSLATIONS: Record<string, Record<string, string>> = {
  english: {},
  tamil: {
    farmerPortal:"விவசாயி போர்டல் · நேரடி",greeting:"வணக்கம்",logout:"வெளியேறு",
    today:"இன்று",humidity:"ஈரப்பதம்",wind:"காற்று",sevenDayRain:"7-நாள் மழை",
    forecastTimeline:"வானிலை முன்னறிவிப்பு",farmingAlerts:"விவசாய எச்சரிக்கைகள்",
    module01:"தொகுதி 01 · விவசாய ஆலோசனை",cropRec:"பயிர் பரிந்துரை",
    nitrogen:"நைட்ரஜன்",phosphorous:"பாஸ்பரஸ்",potassium:"பொட்டாசியம்",
    temperature:"வெப்பநிலை",humidityPct:"ஈரப்பதம் %",ph:"pH அளவு",rainfallMm:"மழை அளவு மிமீ",
    soilType:"மண் வகை",getRecommend:"🌱 பயிர் பரிந்துரை பெறுக",best:"சிறந்தது",
    whyThis:"ஏன் இந்த பரிந்துரை? · SHAP",fertilizer:"உரம்",
    module01b:"தொகுதி 01B · AI நோய் கண்டறிதல்",uploadPhoto:"பயிர் புகைப்படம் பதிவேற்று",
    clickUpload:"பயிர் புகைப்படத்தை பதிவேற்ற கிளிக் செய்யவும்",jpgPng:"JPG, PNG · அதிகபட்சம் 10MB",
    module03:"தொகுதி 03 · விலை நுண்ணறிவு",sevenDay:"7-நாள் முன்னறிவிப்பு",
    thirtyDay:"30-நாள் வரலாறு · AGMARKNET",
    module02:"தொகுதி 02 · சந்தை · Blockchain",listCrop:"என் பயிரை பட்டியலிடு",
    newListing:"புதிய பட்டியல்",cancelBtn:"ரத்து செய்",cropType:"பயிர் வகை",
    quantityKg:"அளவு (கிலோ)",priceKg:"விலை/கிலோ (₹)",district:"மாவட்டம்",
    stateLabel:"மாநிலம்",description:"விளக்கம்",qualityGrade:"தர வகை",
    createListing:"✅ பட்டியல் உருவாக்கு",activeListings:"உங்கள் செயலில் உள்ள பட்டியல்கள்",
    noListings:"பட்டியல் இல்லை — புதிய பட்டியல் கிளிக் செய்யவும்",
    provenanceQR:"தோற்றம் QR",blockchainVerif:"Blockchain சரிபார்க்கப்பட்டது",
    routeOptimizer:"பாதை மேம்படுத்தி · OSRM",shortestRoute:"சந்தைக்கு குறுகிய பாதை",
    farmLat:"நிலம் அட்சரேகை",farmLon:"நிலம் தீர்க்கரேகை",
    mandiLat:"சந்தை அட்சரேகை",mandiLon:"சந்தை தீர்க்கரேகை",
    destName:"இலக்கு பெயர்",getRoute:"🗺️ சிறந்த பாதை பெறுக",
    distance:"தூரம்",duration:"நேரம்",destination:"இலக்கு",
    module04:"தொகுதி 04 · நிதி திட்டமிடல்",investCalc:"முதலீட்டு கணக்கீடு",
    cropLabel:"பயிர்",landAcres:"நிலம் (ஏக்கர்)",category:"வகை",calculate:"💰 கணக்கிடு",
    costPerAcre:"ஏக்கருக்கான செலவு",totalInvestment:"மொத்த முதலீடு",kccLoan:"KCC கடன் (80%)",
    annualInterest:"ஆண்டு வட்டி",netAfterSub:"மானியத்திற்கு பிறகு நிகர",
    kccEmiLabel:"KCC கடன் · 4% ஆண்டுக்கு",emiCalc:"கடன் EMI கணக்கீடு",
    loanAmount:"கடன் தொகை (₹)",interestRate:"வட்டி விகிதம் % ஆண்டுக்கு",
    durationMonths:"காலம் (மாதங்கள்)",calcEmi:"📊 EMI கணக்கிடு",monthlyEmi:"மாதாந்திர EMI",
    totalPayment:"மொத்த செலுத்துகை",totalInterest:"மொத்த வட்டி",principal:"அசல்",
    schemeFinder:"திட்ட கண்டுபிடிப்பு",govtMoney:"உங்களுக்கு தகுந்த அரசு உதவி",
    applyNow:"இப்போது விண்ணப்பிக்கவும்",clickCalc:"திட்டங்களைக் கண்டுபிடிக்க கணக்கீடு கிளிக் செய்யவும்",
    totalSubsidy:"மொத்த மானியம்",thisSeason:"இந்த சீசனில்",
    home:"முகப்பு",advisory:"ஆலோசனை",market:"சந்தை",finance:"நிதி",
    merchantPortal:"வணிகர் போர்டல்",dashboard:"டாஷ்போர்ட்",browseListings:"பட்டியல்களை பார்",
    myOrders:"என் ஆர்டர்கள்",txHistory:"பரிவர்த்தனை வரலாறு",analytics:"பகுப்பாய்வு",
    activeOrders:"செயலில் உள்ள ஆர்டர்கள்",tradeVolume:"வர்த்தக அளவு",
    liveListings:"நேரடி பட்டியல்கள்",completedTrades:"முடிந்த வர்த்தகங்கள்",
    placeOrder:"ஆர்டர் வைக்கவும்",confirmOrder:"✅ ஆர்டர் உறுதிசெய்",
    quantity:"அளவு (கிலோ)",offerPrice:"சலுகை ₹/கிலோ",confirmBtn:"உறுதிசெய்",
    totalLabel:"மொத்தம்",calculating:"கணக்கிடுகிறது…",
    portalTitle:"தேசிய கண்காணிப்பு",restrictedAccess:"மானிட்டர் · கட்டுப்படுத்தப்பட்ட அணுகல்",
    refresh:"புதுப்பி",exportCsv:"CSV ஏற்றுமதி",lastUpdated:"கடைசியாக புதுப்பிக்கப்பட்டது",
    liveLabel:"நேரடி",demoLabel:"டெமோ",overview:"மேலோட்டம்",transactions:"பரிவர்த்தனைகள்",
    listings:"பட்டியல்கள்",auditLog:"தணிக்கை பதிவு",
  },
  hindi: {
    farmerPortal:"किसान पोर्टल · लाइव",greeting:"नमस्ते",logout:"लॉगआउट",
    today:"आज",humidity:"नमी",wind:"हवा",sevenDayRain:"7-दिन की बारिश",
    forecastTimeline:"मौसम पूर्वानुमान",farmingAlerts:"कृषि चेतावनियाँ",
    module01:"मॉड्यूल 01 · स्मार्ट सलाह · XGBoost",cropRec:"फसल सिफारिश",
    nitrogen:"नाइट्रोजन",phosphorous:"फास्फोरस",potassium:"पोटेशियम",
    temperature:"तापमान",humidityPct:"नमी %",ph:"pH स्तर",rainfallMm:"वर्षा मिमी",
    soilType:"मिट्टी का प्रकार",getRecommend:"🌱 फसल सिफारिश पाएं",best:"सर्वश्रेष्ठ",
    whyThis:"यह सिफारिश क्यों? · SHAP",fertilizer:"उर्वरक",
    module01b:"मॉड्यूल 01B · AI रोग पहचान",uploadPhoto:"फसल फोटो अपलोड करें",
    clickUpload:"फसल की फोटो अपलोड करने के लिए क्लिक करें",jpgPng:"JPG, PNG · अधिकतम 10MB",
    module03:"मॉड्यूल 03 · मूल्य बुद्धिमत्ता",sevenDay:"7-दिन पूर्वानुमान",
    thirtyDay:"30-दिन का इतिहास · AGMARKNET",
    module02:"मॉड्यूल 02 · बाजार · Blockchain",listCrop:"मेरी फसल सूचीबद्ध करें",
    newListing:"नई सूची",cancelBtn:"रद्द करें",cropType:"फसल प्रकार",
    quantityKg:"मात्रा (किलो)",priceKg:"मूल्य/किलो (₹)",district:"जिला",
    stateLabel:"राज्य",description:"विवरण",qualityGrade:"गुणवत्ता श्रेणी",
    createListing:"✅ सूची बनाएं",activeListings:"आपकी सक्रिय सूचियाँ",
    noListings:"अभी कोई सूची नहीं",provenanceQR:"उत्पत्ति QR",blockchainVerif:"Blockchain सत्यापित",
    routeOptimizer:"रूट ऑप्टिमाइज़र · OSRM",shortestRoute:"मंडी तक सबसे छोटा रास्ता",
    farmLat:"खेत अक्षांश",farmLon:"खेत देशांतर",mandiLat:"मंडी अक्षांश",
    mandiLon:"मंडी देशांतर",destName:"गंतव्य नाम",getRoute:"🗺️ सबसे अच्छा रास्ता पाएं",
    distance:"दूरी",duration:"समय",destination:"गंतव्य",
    module04:"मॉड्यूल 04 · वित्त योजना",investCalc:"निवेश कैलकुलेटर",
    cropLabel:"फसल",landAcres:"भूमि (एकड़)",category:"श्रेणी",calculate:"💰 गणना करें",
    costPerAcre:"प्रति एकड़ लागत",totalInvestment:"कुल निवेश",kccLoan:"KCC ऋण (80%)",
    annualInterest:"वार्षिक ब्याज",netAfterSub:"सब्सिडी के बाद शुद्ध",
    kccEmiLabel:"KCC ऋण · 4% प्रति वर्ष",emiCalc:"ऋण EMI कैलकुलेटर",
    loanAmount:"ऋण राशि (₹)",interestRate:"ब्याज दर % प्रति वर्ष",
    durationMonths:"अवधि (महीने)",calcEmi:"📊 EMI गणना करें",monthlyEmi:"मासिक EMI",
    totalPayment:"कुल भुगतान",totalInterest:"कुल ब्याज",principal:"मूलधन",
    schemeFinder:"योजना खोजक",govtMoney:"आपके लिए सरकारी सहायता",
    applyNow:"अभी आवेदन करें",clickCalc:"मेल खाने वाली योजनाएं खोजने के लिए गणना करें",
    totalSubsidy:"कुल सब्सिडी",thisSeason:"इस सीजन में",
    home:"होम",advisory:"सलाह",market:"बाजार",finance:"वित्त",
    merchantPortal:"व्यापारी पोर्टल",dashboard:"डैशबोर्ड",browseListings:"सूचियाँ देखें",
    myOrders:"मेरे ऑर्डर",txHistory:"लेनदेन इतिहास",analytics:"विश्लेषण",
    activeOrders:"सक्रिय ऑर्डर",tradeVolume:"व्यापार मात्रा",liveListings:"लाइव सूचियाँ",
    completedTrades:"पूर्ण व्यापार",placeOrder:"ऑर्डर दें",confirmOrder:"✅ ऑर्डर पुष्टि करें",
    quantity:"मात्रा (किलो)",offerPrice:"ऑफर ₹/किलो",confirmBtn:"पुष्टि करें",
    totalLabel:"कुल",calculating:"गणना हो रही है…",
    portalTitle:"राष्ट्रीय टेलीमेट्री",restrictedAccess:"मॉनिटर · प्रतिबंधित पहुंच",
    refresh:"रीफ्रेश",exportCsv:"CSV निर्यात",lastUpdated:"अंतिम अपडेट",
    liveLabel:"लाइव",demoLabel:"डेमो",overview:"अवलोकन",transactions:"लेनदेन",
    listings:"सूचियाँ",auditLog:"ऑडिट लॉग",
  },
  kannada: {
    farmerPortal:"ರೈತ ಪೋರ್ಟಲ್ · ನೇರ",greeting:"ನಮಸ್ಕಾರ",logout:"ಲಾಗ್ ಔಟ್",
    today:"ಇಂದು",humidity:"ತೇವಾಂಶ",wind:"ಗಾಳಿ",sevenDayRain:"7-ದಿನ ಮಳೆ",
    forecastTimeline:"ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ",farmingAlerts:"ಕೃಷಿ ಎಚ್ಚರಿಕೆಗಳು",
    module01:"ಮಾಡ್ಯೂಲ್ 01 · ಸ್ಮಾರ್ಟ್ ಸಲಹೆ",cropRec:"ಬೆಳೆ ಶಿಫಾರಸು",
    nitrogen:"ಸಾರಜನಕ",phosphorous:"ರಂಜಕ",potassium:"ಪೊಟ್ಯಾಸಿಯಮ್",
    temperature:"ತಾಪಮಾನ",humidityPct:"ತೇವಾಂಶ %",ph:"pH ಮಟ್ಟ",rainfallMm:"ಮಳೆ ಮಿಮೀ",
    soilType:"ಮಣ್ಣಿನ ವಿಧ",getRecommend:"🌱 ಬೆಳೆ ಶಿಫಾರಸು ಪಡೆಯಿರಿ",best:"ಅತ್ಯುತ್ತಮ",
    whyThis:"ಈ ಶಿಫಾರಸು ಏಕೆ? · SHAP",fertilizer:"ಗೊಬ್ಬರ",
    module01b:"ಮಾಡ್ಯೂಲ್ 01B · AI ರೋಗ ಪತ್ತೆ",uploadPhoto:"ಬೆಳೆ ಫೋಟೋ ಅಪ್ಲೋಡ್",
    clickUpload:"ಬೆಳೆ ಫೋಟೋ ಅಪ್ಲೋಡ್ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ",jpgPng:"JPG, PNG · ಗರಿಷ್ಠ 10MB",
    module03:"ಮಾಡ್ಯೂಲ್ 03 · ಬೆಲೆ ಬುದ್ಧಿಮತ್ತೆ",sevenDay:"7-ದಿನ ಮುನ್ಸೂಚನೆ",
    thirtyDay:"30-ದಿನ ಇತಿಹಾಸ",module02:"ಮಾಡ್ಯೂಲ್ 02 · ಮಾರುಕಟ್ಟೆ",
    listCrop:"ನನ್ನ ಬೆಳೆ ಪಟ್ಟಿ ಮಾಡಿ",newListing:"ಹೊಸ ಪಟ್ಟಿ",cancelBtn:"ರದ್ದುಮಾಡಿ",
    cropType:"ಬೆಳೆ ವಿಧ",quantityKg:"ಪ್ರಮಾಣ (ಕೆಜಿ)",priceKg:"ಬೆಲೆ/ಕೆಜಿ (₹)",
    district:"ಜಿಲ್ಲೆ",stateLabel:"ರಾಜ್ಯ",description:"ವಿವರಣೆ",qualityGrade:"ಗುಣಮಟ್ಟ",
    createListing:"✅ ಪಟ್ಟಿ ರಚಿಸಿ",activeListings:"ನಿಮ್ಮ ಸಕ್ರಿಯ ಪಟ್ಟಿಗಳು",
    noListings:"ಇನ್ನೂ ಪಟ್ಟಿ ಇಲ್ಲ",provenanceQR:"ಮೂಲ QR",blockchainVerif:"Blockchain ಪರಿಶೀಲಿಸಲಾಗಿದೆ",
    routeOptimizer:"ಮಾರ್ಗ ಅನುಕೂಲಕ · OSRM",shortestRoute:"ಮಂಡಿಗೆ ಚಿಕ್ಕ ಮಾರ್ಗ",
    farmLat:"ತೋಟ ಅಕ್ಷಾಂಶ",farmLon:"ತೋಟ ರೇಖಾಂಶ",mandiLat:"ಮಂಡಿ ಅಕ್ಷಾಂಶ",
    mandiLon:"ಮಂಡಿ ರೇಖಾಂಶ",destName:"ಗಮ್ಯಸ್ಥಾನ ಹೆಸರು",getRoute:"🗺️ ಉತ್ತಮ ಮಾರ್ಗ ಪಡೆಯಿರಿ",
    distance:"ದೂರ",duration:"ಸಮಯ",destination:"ಗಮ್ಯಸ್ಥಾನ",
    module04:"ಮಾಡ್ಯೂಲ್ 04 · ಹಣಕಾಸು ಯೋಜನೆ",investCalc:"ಹೂಡಿಕೆ ಕ್ಯಾಲ್ಕುಲೇಟರ್",
    cropLabel:"ಬೆಳೆ",landAcres:"ಭೂಮಿ (ಎಕರೆ)",category:"ವರ್ಗ",calculate:"💰 ಲೆಕ್ಕ ಮಾಡಿ",
    costPerAcre:"ಎಕರೆಗೆ ವೆಚ್ಚ",totalInvestment:"ಒಟ್ಟು ಹೂಡಿಕೆ",kccLoan:"KCC ಸಾಲ (80%)",
    annualInterest:"ವಾರ್ಷಿಕ ಬಡ್ಡಿ",netAfterSub:"ಸಹಾಯಧನದ ನಂತರ ನಿವ್ವಳ",
    kccEmiLabel:"KCC ಸಾಲ · 4% ವಾರ್ಷಿಕ",emiCalc:"ಸಾಲ EMI ಕ್ಯಾಲ್ಕುಲೇಟರ್",
    loanAmount:"ಸಾಲದ ಮೊತ್ತ (₹)",interestRate:"ಬಡ್ಡಿ ದರ % ವಾರ್ಷಿಕ",
    durationMonths:"ಅವಧಿ (ತಿಂಗಳು)",calcEmi:"📊 EMI ಲೆಕ್ಕ ಮಾಡಿ",monthlyEmi:"ಮಾಸಿಕ EMI",
    totalPayment:"ಒಟ್ಟು ಪಾವತಿ",totalInterest:"ಒಟ್ಟು ಬಡ್ಡಿ",principal:"ಮೂಲ",
    schemeFinder:"ಯೋಜನೆ ಹುಡುಕಾಟ",govtMoney:"ನಿಮಗೆ ಅರ್ಹ ಸರ್ಕಾರಿ ಸಹಾಯ",
    applyNow:"ಈಗ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ",clickCalc:"ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಲು ಲೆಕ್ಕ ಮಾಡಿ",
    totalSubsidy:"ಒಟ್ಟು ಸಹಾಯಧನ",thisSeason:"ಈ ಸೀಸನ್‌ನಲ್ಲಿ",
    home:"ಮುಖಪುಟ",advisory:"ಸಲಹೆ",market:"ಮಾರುಕಟ್ಟೆ",finance:"ಹಣಕಾಸು",
    merchantPortal:"ವ್ಯಾಪಾರಿ ಪೋರ್ಟಲ್",dashboard:"ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",browseListings:"ಪಟ್ಟಿಗಳನ್ನು ನೋಡಿ",
    myOrders:"ನನ್ನ ಆರ್ಡರ್‌ಗಳು",txHistory:"ವ್ಯವಹಾರ ಇತಿಹಾಸ",analytics:"ವಿಶ್ಲೇಷಣೆ",
    activeOrders:"ಸಕ್ರಿಯ ಆರ್ಡರ್‌ಗಳು",tradeVolume:"ವ್ಯಾಪಾರ ಪ್ರಮಾಣ",
    liveListings:"ಲೈವ್ ಪಟ್ಟಿಗಳು",completedTrades:"ಪೂರ್ಣ ವ್ಯಾಪಾರ",
    placeOrder:"ಆರ್ಡರ್ ಮಾಡಿ",confirmOrder:"✅ ಆರ್ಡರ್ ದೃಢಪಡಿಸಿ",
    quantity:"ಪ್ರಮಾಣ (ಕೆಜಿ)",offerPrice:"ಬೆಲೆ ₹/ಕೆಜಿ",confirmBtn:"ದೃಢಪಡಿಸಿ",
    totalLabel:"ಒಟ್ಟು",calculating:"ಲೆಕ್ಕ ಮಾಡಲಾಗುತ್ತಿದೆ…",
    portalTitle:"ರಾಷ್ಟ್ರೀಯ ಟೆಲಿಮೆಟ್ರಿ",restrictedAccess:"ಮಾನಿಟರ್ · ನಿರ್ಬಂಧಿತ",
    refresh:"ಮರುಲೋಡ್",exportCsv:"CSV ರಫ್ತು",lastUpdated:"ಕೊನೆಯ ಅಪ್ಡೇಟ್",
    liveLabel:"ನೇರ",demoLabel:"ಡೆಮೋ",overview:"ಅವಲೋಕನ",transactions:"ವ್ಯವಹಾರಗಳು",
    listings:"ಪಟ್ಟಿಗಳು",auditLog:"ಆಡಿಟ್ ಲಾಗ್",
  },
  telugu: {
    farmerPortal:"రైతు పోర్టల్ · లైవ్",greeting:"నమస్కారం",logout:"లాగ్ అవుట్",
    today:"నేడు",humidity:"తేమ",wind:"గాలి",sevenDayRain:"7-రోజుల వర్షం",
    forecastTimeline:"వాతావరణ అంచనా",farmingAlerts:"వ్యవసాయ హెచ్చరికలు",
    module01:"మాడ్యూల్ 01 · స్మార్ట్ సలహా",cropRec:"పంట సూచన",
    nitrogen:"నైట్రోజన్",phosphorous:"భాస్వరం",potassium:"పొటాషియం",
    temperature:"ఉష్ణోగ్రత",humidityPct:"తేమ %",ph:"pH విలువ",rainfallMm:"వర్షపాతం మిమీ",
    soilType:"నేల రకం",getRecommend:"🌱 పంట సూచన పొందండి",best:"అత్యుత్తమ",
    whyThis:"ఈ సూచన ఎందుకు? · SHAP",fertilizer:"ఎరువు",
    module01b:"మాడ్యూల్ 01B · AI వ్యాధి పరిశోధన",uploadPhoto:"పంట ఫోటో అప్‌లోడ్",
    clickUpload:"పంట ఫోటో అప్‌లోడ్ చేయడానికి క్లిక్ చేయండి",jpgPng:"JPG, PNG · గరిష్ఠ 10MB",
    module03:"మాడ్యూల్ 03 · ధర మేధస్సు",sevenDay:"7-రోజుల అంచనా",
    thirtyDay:"30-రోజుల చరిత్ర",module02:"మాడ్యూల్ 02 · మార్కెట్",
    listCrop:"నా పంటను జాబితా చేయండి",newListing:"కొత్త జాబితా",cancelBtn:"రద్దు",
    cropType:"పంట రకం",quantityKg:"పరిమాణం (కిలో)",priceKg:"ధర/కిలో (₹)",
    district:"జిల్లా",stateLabel:"రాష్ట్రం",description:"వివరణ",qualityGrade:"నాణ్యత గ్రేడ్",
    createListing:"✅ జాబితా సృష్టించండి",activeListings:"మీ క్రియాశీల జాబితాలు",
    noListings:"ఇంకా జాబితా లేదు",provenanceQR:"మూల QR",blockchainVerif:"Blockchain ధృవీకరించబడింది",
    routeOptimizer:"మార్గ ఆప్టిమైజర్ · OSRM",shortestRoute:"మండికి చిన్న మార్గం",
    farmLat:"పొలం అక్షాంశం",farmLon:"పొలం రేఖాంశం",mandiLat:"మండి అక్షాంశం",
    mandiLon:"మండి రేఖాంశం",destName:"గమ్యం పేరు",getRoute:"🗺️ ఉత్తమ మార్గం పొందండి",
    distance:"దూరం",duration:"సమయం",destination:"గమ్యం",
    module04:"మాడ్యూల్ 04 · ఆర్థిక ప్రణాళిక",investCalc:"పెట్టుబడి కాల్కులేటర్",
    cropLabel:"పంట",landAcres:"భూమి (ఎకరాలు)",category:"వర్గం",calculate:"💰 లెక్కించండి",
    costPerAcre:"ఎకరాకు ఖర్చు",totalInvestment:"మొత్తం పెట్టుబడి",kccLoan:"KCC రుణం (80%)",
    annualInterest:"వార్షిక వడ్డీ",netAfterSub:"సబ్సిడీ తర్వాత నికర",
    kccEmiLabel:"KCC రుణం · 4% వార్షిక",emiCalc:"రుణ EMI కాల్కులేటర్",
    loanAmount:"రుణ మొత్తం (₹)",interestRate:"వడ్డీ రేటు % వార్షిక",
    durationMonths:"వ్యవధి (నెలలు)",calcEmi:"📊 EMI లెక్కించండి",monthlyEmi:"నెలవారీ EMI",
    totalPayment:"మొత్తం చెల్లింపు",totalInterest:"మొత్తం వడ్డీ",principal:"అసలు",
    schemeFinder:"పథకం శోధకుడు",govtMoney:"మీకు అర్హత ఉన్న ప్రభుత్వ సహాయం",
    applyNow:"ఇప్పుడు దరఖాస్తు చేయండి",clickCalc:"పథకాలు కనుగొనడానికి లెక్కించండి",
    totalSubsidy:"మొత్తం సబ్సిడీ",thisSeason:"ఈ సీజన్‌లో",
    home:"హోమ్",advisory:"సలహా",market:"మార్కెట్",finance:"ఆర్థికం",
    merchantPortal:"వ్యాపారి పోర్టల్",dashboard:"డాష్‌బోర్డ్",browseListings:"జాబితాలు చూడండి",
    myOrders:"నా ఆర్డర్లు",txHistory:"లావాదేవీ చరిత్ర",analytics:"విశ్లేషణ",
    activeOrders:"క్రియాశీల ఆర్డర్లు",tradeVolume:"వ్యాపార పరిమాణం",
    liveListings:"లైవ్ జాబితాలు",completedTrades:"పూర్తయిన వ్యాపారాలు",
    placeOrder:"ఆర్డర్ చేయండి",confirmOrder:"✅ ఆర్డర్ నిర్ధారించండి",
    quantity:"పరిమాణం (కిలో)",offerPrice:"ఆఫర్ ₹/కిలో",confirmBtn:"నిర్ధారించు",
    totalLabel:"మొత్తం",calculating:"లెక్కిస్తోంది…",
    portalTitle:"జాతీయ టెలిమెట్రీ",restrictedAccess:"మానిటర్ · నిరోధించబడింది",
    refresh:"రిఫ్రెష్",exportCsv:"CSV ఎగుమతి",lastUpdated:"చివరిగా నవీకరించబడింది",
    liveLabel:"లైవ్",demoLabel:"డెమో",overview:"అవలోకనం",transactions:"లావాదేవీలు",
    listings:"జాబితాలు",auditLog:"ఆడిట్ లాగ్",
  },
  marathi: {
    farmerPortal:"शेतकरी पोर्टल · थेट",greeting:"नमस्कार",logout:"लॉगआउट",
    today:"आज",humidity:"आर्द्रता",wind:"वारा",sevenDayRain:"7-दिवस पाऊस",
    forecastTimeline:"हवामान अंदाज",farmingAlerts:"शेती सूचना",
    module01:"मॉड्युल 01 · स्मार्ट सल्ला",cropRec:"पीक शिफारस",
    nitrogen:"नायट्रोजन",phosphorous:"फॉस्फरस",potassium:"पोटॅशियम",
    temperature:"तापमान",humidityPct:"आर्द्रता %",ph:"pH पातळी",rainfallMm:"पाऊस मिमी",
    soilType:"मातीचा प्रकार",getRecommend:"🌱 पीक शिफारस मिळवा",best:"सर्वोत्तम",
    whyThis:"ही शिफारस का? · SHAP",fertilizer:"खत",
    module01b:"मॉड्युल 01B · AI रोग शोध",uploadPhoto:"पीक फोटो अपलोड करा",
    clickUpload:"पीक फोटो अपलोड करण्यासाठी क्लिक करा",jpgPng:"JPG, PNG · जास्तीत जास्त 10MB",
    module03:"मॉड्युल 03 · किंमत बुद्धिमत्ता",sevenDay:"7-दिवस अंदाज",
    thirtyDay:"30-दिवस इतिहास",module02:"मॉड्युल 02 · बाजार",
    listCrop:"माझे पीक सूचीबद्ध करा",newListing:"नवीन यादी",cancelBtn:"रद्द करा",
    cropType:"पिकाचा प्रकार",quantityKg:"प्रमाण (किलो)",priceKg:"किंमत/किलो (₹)",
    district:"जिल्हा",stateLabel:"राज्य",description:"वर्णन",qualityGrade:"गुणवत्ता श्रेणी",
    createListing:"✅ यादी तयार करा",activeListings:"तुमच्या सक्रिय याद्या",
    noListings:"अजून यादी नाही",provenanceQR:"मूळ QR",blockchainVerif:"Blockchain सत्यापित",
    routeOptimizer:"मार्ग ऑप्टिमायझर",shortestRoute:"बाजारापर्यंत छोटा मार्ग",
    farmLat:"शेत अक्षांश",farmLon:"शेत रेखांश",mandiLat:"बाजार अक्षांश",
    mandiLon:"बाजार रेखांश",destName:"गंतव्य नाव",getRoute:"🗺️ सर्वोत्तम मार्ग मिळवा",
    distance:"अंतर",duration:"वेळ",destination:"गंतव्य",
    module04:"मॉड्युल 04 · आर्थिक नियोजन",investCalc:"गुंतवणूक कॅल्क्युलेटर",
    cropLabel:"पीक",landAcres:"जमीन (एकर)",category:"श्रेणी",calculate:"💰 गणना करा",
    costPerAcre:"प्रति एकर खर्च",totalInvestment:"एकूण गुंतवणूक",kccLoan:"KCC कर्ज (80%)",
    annualInterest:"वार्षिक व्याज",netAfterSub:"अनुदानानंतर निव्वळ",
    kccEmiLabel:"KCC कर्ज · 4% वार्षिक",emiCalc:"कर्ज EMI कॅल्क्युलेटर",
    loanAmount:"कर्जाची रक्कम (₹)",interestRate:"व्याज दर % वार्षिक",
    durationMonths:"कालावधी (महिने)",calcEmi:"📊 EMI गणना करा",monthlyEmi:"मासिक EMI",
    totalPayment:"एकूण देयक",totalInterest:"एकूण व्याज",principal:"मूळ रक्कम",
    schemeFinder:"योजना शोधक",govtMoney:"तुमच्यासाठी शासकीय मदत",
    applyNow:"आता अर्ज करा",clickCalc:"जुळणाऱ्या योजना शोधण्यासाठी गणना करा",
    totalSubsidy:"एकूण अनुदान",thisSeason:"या हंगामात",
    home:"मुख्यपृष्ठ",advisory:"सल्ला",market:"बाजार",finance:"आर्थिक",
    merchantPortal:"व्यापारी पोर्टल",dashboard:"डॅशबोर्ड",browseListings:"सूची पहा",
    myOrders:"माझे ऑर्डर",txHistory:"व्यवहार इतिहास",analytics:"विश्लेषण",
    activeOrders:"सक्रिय ऑर्डर",tradeVolume:"व्यापार मात्रा",liveListings:"थेट सूची",
    completedTrades:"पूर्ण व्यापार",placeOrder:"ऑर्डर द्या",confirmOrder:"✅ ऑर्डर पुष्टी करा",
    quantity:"प्रमाण (किलो)",offerPrice:"ऑफर ₹/किलो",confirmBtn:"पुष्टी करा",
    totalLabel:"एकूण",calculating:"गणना होत आहे…",
    portalTitle:"राष्ट्रीय टेलिमेट्री",restrictedAccess:"मॉनिटर · प्रतिबंधित",
    refresh:"रिफ्रेश",exportCsv:"CSV निर्यात",lastUpdated:"शेवटचे अपडेट",
    liveLabel:"थेट",demoLabel:"डेमो",overview:"आढावा",transactions:"व्यवहार",
    listings:"सूची",auditLog:"ऑडिट लॉग",
  },
  gujarati: {
    farmerPortal:"ખેડૂત પોર્ટલ · સીધો",greeting:"નમસ્તે",logout:"લૉગ આઉટ",
    today:"આજે",humidity:"ભેજ",wind:"પવન",sevenDayRain:"7-દિવસ વરસાદ",
    forecastTimeline:"હવામાન આગાહી",farmingAlerts:"ખેતી ચેતવણીઓ",
    module01:"મોડ્યુલ 01 · સ્માર્ટ સલાહ",cropRec:"પાક ભલામણ",
    nitrogen:"નાઇટ્રોજન",phosphorous:"ફોસ્ફરસ",potassium:"પોટેશિયમ",
    temperature:"તાપમાન",humidityPct:"ભેજ %",ph:"pH સ્તર",rainfallMm:"વરસાદ મિ.મી.",
    soilType:"માટીનો પ્રકાર",getRecommend:"🌱 પાક ભલામણ મેળવો",best:"શ્રેષ્ઠ",
    whyThis:"આ ભલામણ શા માટે? · SHAP",fertilizer:"ખાતર",
    module01b:"મોડ્યુલ 01B · AI રોગ શોધ",uploadPhoto:"પાકનો ફોટો અપલોડ કરો",
    clickUpload:"પાકનો ફોટો અપલોડ કરવા ક્લિક કરો",jpgPng:"JPG, PNG · મહત્તમ 10MB",
    module03:"મોડ્યુલ 03 · ભાવ બુદ્ધિ",sevenDay:"7-દિવસ આગાહી",
    thirtyDay:"30-દિવસ ઇતિહાસ",module02:"મોડ્યુલ 02 · બજાર",
    listCrop:"મારો પાક સૂચિ કરો",newListing:"નવી સૂચિ",cancelBtn:"રદ કરો",
    cropType:"પાકનો પ્રકાર",quantityKg:"જથ્થો (કિ.ગ્રા.)",priceKg:"ભાવ/કિ.ગ્રા. (₹)",
    district:"જિલ્લો",stateLabel:"રાજ્ય",description:"વર્ણન",qualityGrade:"ગુણવત્તા",
    createListing:"✅ સૂચિ બનાવો",activeListings:"તમારી સક્રિય સૂચિઓ",
    noListings:"હજુ સૂચિ નથી",provenanceQR:"ઉત્પત્તિ QR",blockchainVerif:"Blockchain ચકાસાયેલ",
    routeOptimizer:"રૂટ ઓપ્ટિમાઇઝર",shortestRoute:"મંડી સુધી ટૂંકો રસ્તો",
    farmLat:"ખેત અક્ષાંશ",farmLon:"ખેત રેખાંશ",mandiLat:"મંડી અક્ષાંશ",
    mandiLon:"મંડી રેખાંશ",destName:"ગંતવ્ય નામ",getRoute:"🗺️ શ્રેષ્ઠ રૂટ મેળવો",
    distance:"અંતર",duration:"સમય",destination:"ગંતવ્ય",
    module04:"મોડ્યુલ 04 · નાણાકીય આયોજન",investCalc:"રોકાણ કેલ્ક્યુલેટર",
    cropLabel:"પાક",landAcres:"જમીન (એકર)",category:"શ્રેણી",calculate:"💰 ગણતરી",
    costPerAcre:"પ્રતિ એકર ખર્ચ",totalInvestment:"કુલ રોકાણ",kccLoan:"KCC લોન (80%)",
    annualInterest:"વાર્ષિક વ્યાજ",netAfterSub:"સબસિડી પછી નિવ્વળ",
    kccEmiLabel:"KCC લોન · 4% વાર્ષિક",emiCalc:"લોન EMI કેલ્ક્યુલેટર",
    loanAmount:"લોન રકમ (₹)",interestRate:"વ્યાજ દર % વાર્ષિક",
    durationMonths:"અવધિ (મહિના)",calcEmi:"📊 EMI ગણતરી",monthlyEmi:"માસિક EMI",
    totalPayment:"કુલ ચુકવણી",totalInterest:"કુલ વ્યાજ",principal:"મૂળ",
    schemeFinder:"યોજના શોધક",govtMoney:"તમારા માટે સરકારી સહાય",
    applyNow:"અત્યારે અરજી કરો",clickCalc:"યોજનાઓ શોધવા ગણતરી ક્લિક કરો",
    totalSubsidy:"કુલ સબસિડી",thisSeason:"આ સિઝનમાં",
    home:"હોમ",advisory:"સલાહ",market:"બજાર",finance:"નાણાં",
    merchantPortal:"વ્યાપારી પોર્ટલ",dashboard:"ડૅશબોર્ડ",browseListings:"સૂચિઓ જુઓ",
    myOrders:"મારા ઓર્ડર",txHistory:"વ્યવહાર ઇતિહાસ",analytics:"વિશ્લેષણ",
    activeOrders:"સક્રિય ઓર્ડર",tradeVolume:"વ્યાપાર જથ્થો",liveListings:"સીધી સૂચિઓ",
    completedTrades:"પૂર્ણ વ્યાપાર",placeOrder:"ઓર્ડર આપો",confirmOrder:"✅ ઓર્ડર પુષ્ટિ",
    quantity:"જથ્થો (કિ.ગ્રા.)",offerPrice:"ઓફર ₹/કિ.ગ્રા.",confirmBtn:"પુષ્ટિ કરો",
    totalLabel:"કુલ",calculating:"ગણતરી…",
    portalTitle:"રાષ્ટ્રીય ટેલિમેટ્રી",restrictedAccess:"મોનિટર · પ્રતિબંધિત",
    refresh:"રિફ્રેશ",exportCsv:"CSV નિકાસ",lastUpdated:"છેલ્લે અપડેટ",
    liveLabel:"સીધો",demoLabel:"ડેમો",overview:"સમીક્ષા",transactions:"વ્યવહારો",
    listings:"સૂચિઓ",auditLog:"ઓડિટ લોગ",
  },
};

// ── In-memory cache for Groq dynamic translations ─────────────────────────────
const groqCache = new Map<string, string>();

// ── translateText — single dynamic string via Groq API ────────────────────────
// Use this for: advisory results, disease diagnosis, farming alerts from backend
export const translateText = async (
  text: string,
  lang: string
): Promise<string> => {
  if (!text?.trim() || lang === "english") return text;
  const key = `${lang}::${text.slice(0, 120)}`;
  if (groqCache.has(key)) return groqCache.get(key)!;
  try {
    const token = localStorage.getItem("agrichain_token");
    const res = await fetch(`${BASE_URL}/api/language/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text, target_language: lang }),
    });
    if (!res.ok) return text;
    const data = await res.json();
    const translated = data.translated || text;
    groqCache.set(key, translated);
    return translated;
  } catch {
    return text;
  }
};

// ── translateBatch — UI labels via pre-built dict (INSTANT, no API) ───────────
// Falls back to Groq only for keys not in dict
export const translateBatch = async (
  items: Record<string, string>,
  lang: string
): Promise<Record<string, string>> => {
  if (lang === "english") return items;
  const dict = UI_TRANSLATIONS[lang] || {};
  const result: Record<string, string> = {};
  const missing: Record<string, string> = {};

  for (const [k, v] of Object.entries(items)) {
    if (dict[k]) {
      result[k] = dict[k]; // instant from pre-built
    } else {
      missing[k] = v; // needs Groq
    }
  }

  // Translate missing keys via Groq in parallel (max 5 at a time)
  const missingKeys = Object.keys(missing);
  for (let i = 0; i < missingKeys.length; i += 5) {
    const chunk = missingKeys.slice(i, i + 5);
    const translated = await Promise.all(
      chunk.map(async (k) => [k, await translateText(missing[k], lang)] as [string, string])
    );
    for (const [k, v] of translated) result[k] = v;
  }

  return result;
};

// ── useTranslation hook ───────────────────────────────────────────────────────
export const useTranslation = () => {
  const [lang, setLang] = useState<string>(
    () => localStorage.getItem("agrichain_lang") || "english"
  );
  const [isTranslating, setIsTranslating] = useState(false);

  const changeLang = useCallback((newLang: string) => {
    setLang(newLang);
    localStorage.setItem("agrichain_lang", newLang);
  }, []);

  return { lang, changeLang, isTranslating, setIsTranslating };
};