import { createInstance, type Namespace } from "i18next";
import { namespaces, resources } from "./resources";
import { defaultNS, fallbackLng } from "./settings";

/**
 * サーバーコンポーネント / generateMetadata 用の i18next インスタンス。
 * リソースはバンドル済みなので initAsync:false で同期初期化し、
 * import 直後から getFixedT が使える状態にする。
 */
const instance = createInstance();
instance.init({
	lng: fallbackLng,
	fallbackLng,
	ns: namespaces,
	defaultNS,
	resources,
	initAsync: false,
	interpolation: { escapeValue: false },
});

/**
 * サーバー側の翻訳関数を取得する。
 * 返り値の t は指定 namespace に型付けされ、キーは型チェック+補完される。
 */
export function getT<Ns extends Namespace = typeof defaultNS>(ns?: Ns) {
	return instance.getFixedT(fallbackLng, (ns ?? defaultNS) as Ns);
}
