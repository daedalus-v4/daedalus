import type { CustomThemeConfig } from "@skeletonlabs/tw-plugin";

export const theme: CustomThemeConfig = {
    name: "daedalus-theme",
    properties: {
        // =~= Theme Properties =~=
        "--theme-font-family-base": `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
        "--theme-font-family-heading": `Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'`,
        "--theme-font-color-base": "0 0 0",
        "--theme-font-color-dark": "255 255 255",
        "--theme-rounded-base": "8px",
        "--theme-rounded-container": "8px",
        "--theme-border-base": "1px",
        // =~= Theme On-X Colors =~=
        "--on-primary": "255 255 255",
        "--on-secondary": "255 255 255",
        "--on-tertiary": "255 255 255",
        "--on-success": "255 255 255",
        "--on-warning": "255 255 255",
        "--on-error": "255 255 255",
        "--on-surface": "255 255 255",
        // =~= Theme Colors  =~=
        // primary | #14665d
        "--color-primary-50": "220 232 231", // #dce8e7
        "--color-primary-100": "208 224 223", // #d0e0df
        "--color-primary-200": "196 217 215", // #c4d9d7
        "--color-primary-300": "161 194 190", // #a1c2be
        "--color-primary-400": "91 148 142", // #5b948e
        "--color-primary-500": "20 102 93", // #14665d
        "--color-primary-600": "18 92 84", // #125c54
        "--color-primary-700": "15 77 70", // #0f4d46
        "--color-primary-800": "12 61 56", // #0c3d38
        "--color-primary-900": "10 50 46", // #0a322e
        // secondary | #b70771
        "--color-secondary-50": "244 218 234", // #f4daea
        "--color-secondary-100": "241 205 227", // #f1cde3
        "--color-secondary-200": "237 193 220", // #edc1dc
        "--color-secondary-300": "226 156 198", // #e29cc6
        "--color-secondary-400": "205 81 156", // #cd519c
        "--color-secondary-500": "183 7 113", // #b70771
        "--color-secondary-600": "165 6 102", // #a50666
        "--color-secondary-700": "137 5 85", // #890555
        "--color-secondary-800": "110 4 68", // #6e0444
        "--color-secondary-900": "90 3 55", // #5a0337
        // tertiary | #0e57b7
        "--color-tertiary-50": "219 230 244", // #dbe6f4
        "--color-tertiary-100": "207 221 241", // #cfddf1
        "--color-tertiary-200": "195 213 237", // #c3d5ed
        "--color-tertiary-300": "159 188 226", // #9fbce2
        "--color-tertiary-400": "86 137 205", // #5689cd
        "--color-tertiary-500": "14 87 183", // #0e57b7
        "--color-tertiary-600": "13 78 165", // #0d4ea5
        "--color-tertiary-700": "11 65 137", // #0b4189
        "--color-tertiary-800": "8 52 110", // #08346e
        "--color-tertiary-900": "7 43 90", // #072b5a
        // success | #077536
        "--color-success-50": "218 234 225", // #daeae1
        "--color-success-100": "205 227 215", // #cde3d7
        "--color-success-200": "193 221 205", // #c1ddcd
        "--color-success-300": "156 200 175", // #9cc8af
        "--color-success-400": "81 158 114", // #519e72
        "--color-success-500": "7 117 54", // #077536
        "--color-success-600": "6 105 49", // #066931
        "--color-success-700": "5 88 41", // #055829
        "--color-success-800": "4 70 32", // #044620
        "--color-success-900": "3 57 26", // #03391a
        // warning | #727008
        "--color-warning-50": "234 234 218", // #eaeada
        "--color-warning-100": "227 226 206", // #e3e2ce
        "--color-warning-200": "220 219 193", // #dcdbc1
        "--color-warning-300": "199 198 156", // #c7c69c
        "--color-warning-400": "156 155 82", // #9c9b52
        "--color-warning-500": "114 112 8", // #727008
        "--color-warning-600": "103 101 7", // #676507
        "--color-warning-700": "86 84 6", // #565406
        "--color-warning-800": "68 67 5", // #444305
        "--color-warning-900": "56 55 4", // #383704
        // error | #8e1515
        "--color-error-50": "238 220 220", // #eedcdc
        "--color-error-100": "232 208 208", // #e8d0d0
        "--color-error-200": "227 197 197", // #e3c5c5
        "--color-error-300": "210 161 161", // #d2a1a1
        "--color-error-400": "176 91 91", // #b05b5b
        "--color-error-500": "142 21 21", // #8e1515
        "--color-error-600": "128 19 19", // #801313
        "--color-error-700": "107 16 16", // #6b1010
        "--color-error-800": "85 13 13", // #550d0d
        "--color-error-900": "70 10 10", // #460a0a
        // surface | #2b2d31
        "--color-surface-50": "223 224 224", // #dfe0e0
        "--color-surface-100": "213 213 214", // #d5d5d6
        "--color-surface-200": "202 203 204", // #cacbcc
        "--color-surface-300": "170 171 173", // #aaabad
        "--color-surface-400": "107 108 111", // #6b6c6f
        "--color-surface-500": "43 45 49", // #2b2d31
        "--color-surface-600": "39 41 44", // #27292c
        "--color-surface-700": "32 34 37", // #202225
        "--color-surface-800": "26 27 29", // #1a1b1d
        "--color-surface-900": "21 22 24", // #151618
    },
};
