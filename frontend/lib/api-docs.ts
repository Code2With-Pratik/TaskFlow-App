const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

export const apiDocsUrl = apiBaseUrl
  ? `${apiBaseUrl}/api/docs`
  : "https://github.com/Code2With-Pratik/TaskFlow-App/tree/main/backend";
