/**
 * @module utils
 */

/**
 *
 *
 * @export
 * @return {*}  {string}
 */
export function getRandomColor(): string {
  const letters = "0123456789ABCDEF";
  let color = "#";

  for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];

  return color;
}

/**
 *
 * @export
 * @param arr
 * @param key
 * @param val
 * @returns object or empty struct
 */
export function getObjFromArrByKeyValuePair(
  arr: any[],
  key: string,
  val: any
): any {
  const obj = arr.filter((entry) => entry[key].indexOf(val) > -1)[0];

  return typeof obj !== "undefined" ? obj : {};
}

/**
 *remove duplicate entries, by key, from an array
 * @export
 * @param {{ [x: string]: any }[]} arr
 * @param {string} key
 * @return {*}  {{ [x: string]: any }[]}
 */
export function removeDuplicatesByKey(
  arr: { [x: string]: any }[],
  key: string
): { [x: string]: any }[] {
  const trimmedArray = [];
  const values = [];
  const arrLen = arr.length;

  for (let i = 0; i < arrLen; i++) {
    let value = arr[i][key];
    if (values.indexOf(value) === -1) {
      trimmedArray.push(arr[i]);
      values.push(value);
    }
  }
  return trimmedArray;
}

/**
 *  retrieve a texture from the current window
 *
 * @export getTextureFromCanvas
 * @param {(
 *     ctx: CanvasRenderingContext2D,
 *     width: number,
 *     height: number
 *   ) => void} callback
 * @return {*}  {HTMLCanvasElement}
 */
export function getTextureFromCanvas(
  callback: (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => void
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
  const width = window.innerWidth;
  const height = window.innerHeight;

  callback(ctx, width, height);

  return canvas;
}

/**
 * Date subtraction - dates are numbers, not structures
 *
 * @export
 * @param {number} date1
 * @param {number} date2
 * @return {*}  {number}
 */
export function subtractDateFromAnotherDate(
  date1: number,
  date2: number
): number {
  return Math.abs(date2 - date1);
}
/** number of milliseconds in a year */
export const MILLISECONDS_PER_YEAR = 31536000000;

/**
 *
 *
 * @export
 * @param {number} milliseconds
 * @return {number}  years
 */
export function convertMillisecondsToYears(milliseconds: number): number {
  return milliseconds / 31536000000;
}

/**
 * Do something with page numbers to describe start and end
 *
 * @export
 * @param {number} page
 * @param {number} count
 * @return {*}  {{ start: number; end: number; }}
 */
export function getPaginationRange(
  page: number,
  count: number
): { start: number; end: number } {
  let start;
  let end;

  if (count <= 3) {
    start = 1;
    end = count;
  } else {
    if (page <= 2) {
      start = 1;
      end = 3;
    } else if (page + 1 >= count) {
      start = count - 2;
      end = count;
    } else {
      start = page - 1;
      end = page + 1;
    }
  }

  return { start, end };
}

/**
 * generates the linear

 * @param {number} x1
 * @param {number} x2
 * @param {number} n
 * @return {nummber[]}
 */
function linspace(x1: number, x2: number, n: number): number[] {
  let result = [x1];
  const diff = (x2 - x1) / (n - 1);
  for (let i = 0; i < n - 1; i++) {
    result.push(result[result.length - 1] + diff);
  }
  return result;
}

/**
 *
 * e1 and e2 are the logarithms of x1 and x2 (base 10)
 *
 * @param {number} e1
 * @param {number} e2
 * @param {number} n
 * @return {*}
 */
function logspace(e1: number, e2: number, n: number) {
  // e1 and e2 are the logarithms of x1 and x2 (base 10)
  const exponents = linspace(e1, e2, n);
  return exponents.map((e) => Math.pow(10, e));
}

/**
 *
 *
 * @param {number} x1
 * @param {number} x2
 * @param {number} n
 * @return {*}
 */
function geomspace(x1: number, x2: number, n: number) {
  // same as logspace, except you pass in x1 and x2 as is and log is taken internally.
  return logspace(Math.log10(x1), Math.log10(x2), n);
}

/**
 *
 *
 * @export
 * @param {number} min
 * @param {number} max
 * @param {number} nButtons
 * @return {*}
 */
export function getRangeValues(min: number, max: number, nButtons: number) {
  if (max / 2 < min) {
    return geomspace(min, max, nButtons);
  } else {
    return geomspace(min, max / 2, nButtons - 1).concat([max]);
  }
}
/**
 *
 *
 * @export yearsToYearsMonthsDays
 * @param {number} value
 * @return {*}  {string}
 */

export function yearsToYearsMonthsDays(value: number): string {
  const totalDays = value * 365;
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays - years * 365) / 30);
  const days = Math.floor(totalDays - years * 365 - months * 30);

  return `${years} years, ${months} months, ${days} days`;
}
