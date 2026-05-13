export interface ColumnRef {
  table: string | null;
  column: string;
}

export type AliasMap = Record<string, string>;

// Walks the AST recursively to build a map of alias -> table name.
// Handles subqueries by recursing into nested AST nodes.
export function extractColumnRef(node: any): ColumnRef[] {
  if (node === null || typeof node !== 'object') {
    return [];
  }

  if (Array.isArray(node)) {
    return node.flatMap((item) => extractColumnRef(item));
  }

  if (node['type'] === 'column_ref') {
    return [{ table: node.table, column: node.column.split('::')[0] }];
  }

  return Object.values(node).flatMap((item) => extractColumnRef(item));
}

export function extractAliasMap(node: any): AliasMap {
  if (node === undefined || node === null || typeof node !== 'object') {
    return {};
  }

  if (Array.isArray(node)) {
    return node
      .map((item) => extractAliasMap(item))
      .reduce((acc, map) => ({ ...acc, ...map }), {}); // Merge all results into one object.
  }

  if (!node.from) {
    return Object.values(node)
      .map((value) => extractAliasMap(value))
      .reduce((acc, map) => ({ ...acc, ...map }), {});
  }

  const aliasMap = node.from.reduce((acc: AliasMap, item: any) => {
    if (item.as === null) {
      acc[item.table] = item.table;
      return acc;
    }

    acc[item.as] = item.table;
    return acc;
  }, {});

  const childMaps = Object.values(node)
    .map((value) => extractAliasMap(value)) // Recurse into each child
    .reduce((acc, map) => ({ ...acc, ...map }), {}); // Merge all results into one object.

  return { ...aliasMap, ...childMaps };
}

export function resolveAlias(
  columnRef: ColumnRef[],
  aliasMap: AliasMap,
): ColumnRef[] {
  return columnRef.map((item) => ({
    table:
      item.table === null && Object.values(aliasMap).length === 1
        ? Object.values(aliasMap)[0]
        : item.table === null && Object.values(aliasMap).length > 1
          ? null
          : aliasMap[item.table!],
    column: item.column,
  }));
}
