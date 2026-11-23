import type { IMutField } from "@kanaries/graphic-walker";

export type DataRow = Record<string, string | number | boolean | null>;

export const SAMPLE_ROWS: DataRow[] = [
  { Month: "Jan", Region: "North", Category: "Furniture", Sales: 18200, Profit: 3640 },
  { Month: "Jan", Region: "South", Category: "Technology", Sales: 24100, Profit: 5220 },
  { Month: "Feb", Region: "East", Category: "Office supplies", Sales: 13400, Profit: 2410 },
  { Month: "Feb", Region: "West", Category: "Furniture", Sales: 19800, Profit: 3180 },
  { Month: "Mar", Region: "North", Category: "Technology", Sales: 28600, Profit: 7110 },
  { Month: "Mar", Region: "South", Category: "Office supplies", Sales: 15700, Profit: 3020 },
  { Month: "Apr", Region: "East", Category: "Furniture", Sales: 22100, Profit: 4150 },
  { Month: "Apr", Region: "West", Category: "Technology", Sales: 31400, Profit: 8270 },
  { Month: "May", Region: "North", Category: "Office supplies", Sales: 16900, Profit: 2980 },
  { Month: "May", Region: "South", Category: "Furniture", Sales: 20400, Profit: 3620 },
  { Month: "Jun", Region: "East", Category: "Technology", Sales: 33700, Profit: 9030 },
  { Month: "Jun", Region: "West", Category: "Office supplies", Sales: 17600, Profit: 3310 },
  { Month: "Jul", Region: "North", Category: "Furniture", Sales: 23200, Profit: 4390 },
  { Month: "Jul", Region: "South", Category: "Technology", Sales: 35800, Profit: 9970 },
  { Month: "Aug", Region: "East", Category: "Office supplies", Sales: 19300, Profit: 3620 },
  { Month: "Aug", Region: "West", Category: "Furniture", Sales: 25400, Profit: 5010 },
  { Month: "Sep", Region: "North", Category: "Technology", Sales: 39100, Profit: 11120 },
  { Month: "Sep", Region: "South", Category: "Office supplies", Sales: 21100, Profit: 4070 },
  { Month: "Oct", Region: "East", Category: "Furniture", Sales: 26800, Profit: 5280 },
  { Month: "Oct", Region: "West", Category: "Technology", Sales: 42200, Profit: 12340 },
  { Month: "Nov", Region: "North", Category: "Office supplies", Sales: 22700, Profit: 4370 },
  { Month: "Nov", Region: "South", Category: "Furniture", Sales: 29100, Profit: 5790 },
  { Month: "Dec", Region: "East", Category: "Technology", Sales: 46800, Profit: 13920 },
  { Month: "Dec", Region: "West", Category: "Office supplies", Sales: 25200, Profit: 4810 }
];

export function inferFields(rows: DataRow[]): IMutField[] {
  const columns = Object.keys(rows[0] ?? {});
  return columns.map((name, index) => {
    const values = rows.map((row) => row[name]).filter((value) => value !== null && value !== undefined && value !== "");
    const numeric = values.length > 0 && values.every((value) => typeof value === "number" && Number.isFinite(value));
    return {
      fid: `field_${index + 1}`,
      name,
      basename: name,
      analyticType: numeric ? "measure" : "dimension",
      semanticType: numeric ? "quantitative" : "nominal"
    };
  });
}
