import pkg from 'node-sql-parser';

const { Parser } = pkg;
const parser = new Parser();

export function validateReadOnlyQuery(sqlQuery: string): void {
  // Strip PostgreSQL cast syntax (::numeric, ::date) before parsing
  // node-sql-parser doesn't support PostgreSQL cast syntax
  const cleanedSqlQuery = sqlQuery.replace(/::[a-zA-Z]+/g, '');
  const ast = parser.astify(cleanedSqlQuery);
  const statements = Array.isArray(ast) ? ast : [ast];

  for (const stmt of statements) {
    if (stmt.type !== 'select') {
      throw new Error('Only SELECT queries are allowed');
    }
  }
}
