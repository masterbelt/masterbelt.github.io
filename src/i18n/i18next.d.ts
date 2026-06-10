import "i18next";
import { resources } from "./resources";
import { defaultNS, fallbackLng } from "./settings";

/**
 * i18next の型拡張。t() のキーを resources（= JSON）からコンパイル時に検証する。
 * これにより `t("home.lead")` は補完が効き、タイポ／リネーム漏れは tsc でエラーになる。
 * resources.ts に namespace を足せば、ここを触らずとも全 namespace が型に反映される。
 */
declare module "i18next" {
	interface CustomTypeOptions {
		defaultNS: typeof defaultNS;
		resources: (typeof resources)[typeof fallbackLng];
	}
}
