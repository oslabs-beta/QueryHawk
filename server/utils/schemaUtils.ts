export function formatSchemaForGPT(
  columns: { table_name: string; column_name: string; data_type: string }[],
): string {
  const schemaContext = columns.reduce(
    (acc, currentElement) => {
      if (!acc[currentElement.table_name]) {
        // Creating tables name with an empty array if it doesnt exist so we can push in column_name and data_type after
        acc[currentElement.table_name] = [];
      }

      // Push column_name(data_type) into table_name
      acc[currentElement.table_name].push(
        `${currentElement.column_name} (${currentElement.data_type})`,
      );

      return acc;
    },
    {} as Record<string, string[]>,
  );

  // Format schemaContext into a readable string for GPT
  const formattedSchema = Object.entries(schemaContext)
    .map(([tableName, columns]) => {
      return `Table: ${tableName}\n - ${columns.join('\n - ')}`;
    })
    .join('\n\n');

  return formattedSchema;
}
