export const metadataRequest = async <TData>(
  query: string,
  variables: Record<string, unknown> = {},
): Promise<TData> => {
  const response = await fetch(`${process.env.TWENTY_API_URL}/metadata`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.TWENTY_API_KEY}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const { data, errors } = (await response.json()) as {
    data: TData;
    errors?: { message: string; extensions?: unknown }[];
  };

  if (errors?.length) {
    throw new Error(`Metadata request failed: ${errors[0].message} ${JSON.stringify(errors[0].extensions)}`);
  }

  return data;
};
