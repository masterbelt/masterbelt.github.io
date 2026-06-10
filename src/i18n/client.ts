"use client";

import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { namespaces, resources } from "./resources";
import { defaultNS, fallbackLng } from "./settings";

/**
 * クライアントコンポーネント（useTranslation）用の i18next インスタンス。
 * リソースはバンドル済みなので initAsync:false で同期初期化し、
 * ハイドレーション時点でサーバー描画と同じ文言を返す（ちらつき防止）。
 */
if (!i18next.isInitialized) {
	i18next.use(initReactI18next).init({
		lng: fallbackLng,
		fallbackLng,
		ns: namespaces,
		defaultNS,
		resources,
		initAsync: false,
		interpolation: { escapeValue: false },
		react: { useSuspense: false },
	});
}

export default i18next;
