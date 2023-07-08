declare module "vexchords" {
    export interface ChordBoxOptions {
        /**
         * Canvas width
         */
        width?: number;

        /**
         * Canvas height
         */
        height?: number;

        /**
         * Note circle radius
         */
        circleRadius?: number;

        /**
         * Number of strings (e.g., 4 for bass)
         */
        numStrings?: number;

        /**
         * Number of frets (e.g., 7 for stretch chords)
         */
        numFrets?: number;

        /**
         * Show tuning keys
         */
        showTuning?: boolean;

        defaultColor?: string;
        bgColor?: string;
        strokeColor?: string;
        textColor?: string;
        stringColor?: string;
        fretColor?: string;
        labelColor?: string;

        fretWidth?: string;
        stringWidth?: string;

        fontFamily?: CSSStyleDeclaration.fontFamily;
        fontSize?: CSSStyleDeclaration.fontSize;
        fontWeight?: CSSStyleDeclaration.fontWeight;
        fontStyle?: CSSStyleDeclaration.fontStyle;
        labelWeight?: CSSStyleDeclaration.fontWeight;
    }

    export type StringNumber = number
    export type FretNumber = number
    export type Label = string

    export type GuitarString = [StringNumber, FretNumber, Label?] | [StringNumber, 'x']

    export interface VexChordDefinition {
        /**
         * position marker
         */
        position?: number
        /**
         * Array of [string, fret, label (optional)]
         */
        chord: GuitarString[],
        /**
         * Barres definitions
         * @example
         * // Creates a barre line over six strings on the first fret
         * {
         *      barres: [{fromString: 6, toString: 1, fret: 1}]
         * }
         */
        barres?: {fromString: number, toString: number, fret: number}[],
        tuning?: string[]
    }

    export class ChordBox
    {
        constructor(selector: string|Element, options?: ChordBoxOptions);
        draw(options: VexChordDefinition);
    }

    export function draw(selector: string|Element, options: VexChordDefinition, chordBoxOptions?: ChordBoxOptions);
}
