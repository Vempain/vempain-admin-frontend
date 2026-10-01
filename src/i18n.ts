import i18n from "i18next";
import {initReactI18next} from "react-i18next";

void i18n
    .use(initReactI18next)
    .init({
        fallbackLng: "en",
        interpolation: {escapeValue: false},
        resources: {
            en: {
                translation: {
                    common: {
                        table: {
                            fetchLimitReached: "Only the first {{rows}} rows could be loaded.",
                            filter: {
                                reset: "Reset",
                                searchColumn: "Search {{column}}",
                                select: "Select a value"
                            },
                            loadError: "Failed to load table data.",
                            pagination: {
                                total: "{{from}}-{{to}} of {{total}}"
                            }
                        }
                    }
                }
            }
        }
    });

export default i18n;
