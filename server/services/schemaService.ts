import pg from 'pg';

interface PlanNode {
  'Node Type': string;
  'Relation Name'?: string;
  Plans?: PlanNode[];
}

const buildExplainQuery = (sqlQuery: string): string =>
  `EXPLAIN (FORMAT JSON) ${sqlQuery}`;

// Runs EXPLAIN (FORMAT JSON) on the users query
export async function fetchTableNames(
  uri_string: string,
  query: string,
): Promise<Set<string>> {
  const { Pool } = pg;
  const userDBPool = new Pool({
    connectionString: uri_string,
    query_timeout: 5000,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    const result = await userDBPool.query(buildExplainQuery(query));

    // Extract root plan node
    const rootPlanNode = result.rows[0]['QUERY PLAN'][0]['Plan'];
    const tableNames = extractTableNames(rootPlanNode);
    return tableNames;
  } catch (error) {
    console.error('Error fetching table names', error);
    throw error;
  } finally {
    await userDBPool.end();
  }
}

// Recursively walks the EXPLAIN tree and collects every "Relation Name"
function extractTableNames(planNode: PlanNode): Set<string> {
  const tableNames = new Set<string>();

  // If current node has "Relation Name" add it to set.
  if (planNode['Relation Name']) {
    tableNames.add(planNode['Relation Name']);
  }
  // If planNode["Plans"] exists loop throuhg each child and recursive call with extractTableName on it
  // Merge results into the Set.
  if (planNode['Plans']) {
    // Iterate over each child node in the Plans array
    for (const child of planNode['Plans']) {
      const childNames = extractTableNames(child); // returns a set
      // Iterate childNames set and add each string into our tableName Set.
      for (const name of childNames) {
        tableNames.add(name);
      }
    }
  }
  return tableNames;
}

// Receives the Set of table names from fetchTableNames that uses extractTableNames
export async function fetchSchemaContext(
  uri_string: string,
  tableNames: Set<string>,
): Promise<{ table_name: string; column_name: string; data_type: string }[]> {
  if (tableNames.size === 0) {
    return [];
  }

  const { Pool } = pg;
  const userDBPool = new Pool({
    connectionString: uri_string,
    query_timeout: 5000,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    const tableArray = [...tableNames];
    const placeholder = tableArray
      .map((tableName, index) => `$${index + 1}`)
      .join(', ');

    // Queries information_schema.columns for only those tables
    const result = await userDBPool.query(
      `
        SELECT table_name, column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name IN (${placeholder})
      `,
      tableArray,
    );
    // Returns array of {table_name, column_name, data_type}
    return result.rows;
  } catch (error) {
    console.error('Error fetching schema context', error);
    throw error;
  } finally {
    await userDBPool.end();
  }
}
