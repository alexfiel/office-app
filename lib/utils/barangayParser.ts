export const BARANGAY_CODE_MAP: Record<string, string> = {
    "POB1": "POBLACION 1",
    "POB2": "POBLACION 2",
    "POB3": "POBLACION 3",
    "SI": "SAN ISIDRO",
    "DAM": "DAMPAS",
    "BOOY": "BOOY",
    "BOOL": "BOOL",
    "UBU": "UBUJAN",
    "TIP": "TIPTIP",
    "CAB": "CABAWAN",
    "COG": "COGON",
    "MANSA": "MANSASA",
    "MAN": "MANSASA",
    "MANGA": "MANGA",
    "DAO": "DAO",
    "TAL": "TALOTO",
};

/**
 * Extracts the barangay prefix from a voucher code and returns the full barangay name.
 * Handles prefixes that are between 2 and 5 characters long before any numbers or hyphens.
 */
export function getBarangayFromVoucherCode(voucherCode: string): string {
    if (!voucherCode) return "N/A";

    // Convert to uppercase to match the map
    const code = voucherCode.toUpperCase().trim();

    // Extract the alphabetic prefix and any trailing numbers if they're part of the code (like POB1)
    // We can just iterate over the map keys and see if the code starts with it
    // Sort keys by length descending to match longest prefix first (e.g., MANSA before MAN, POB1 before POB)
    const sortedKeys = Object.keys(BARANGAY_CODE_MAP).sort((a, b) => b.length - a.length);

    for (const prefix of sortedKeys) {
        if (code.startsWith(prefix)) {
            return BARANGAY_CODE_MAP[prefix];
        }
    }

    return voucherCode;
}
