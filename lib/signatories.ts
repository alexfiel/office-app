export const DEFAULT_HEAD_OF_OFFICE = {
  id: "default-head-of-office",
  name: "HUBERT M. INAS, CPA, BCLTE",
  designation: "City Treasurer",
  office: "Office of the City Treasurer",
  signatureUrl: "",
  isHeadOfOffice: true,
  isActive: true,
};

export type SignatoryData = {
  id?: string;
  name: string;
  designation: string;
  office?: string | null;
  signatureUrl?: string | null;
  isHeadOfOffice?: boolean;
  isActive?: boolean;
};
