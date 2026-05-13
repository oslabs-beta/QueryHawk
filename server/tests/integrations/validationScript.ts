import {
  fetchSchemaContext,
  fetchTableNames,
} from '../../services/schemaService';
import { optimizeQuery } from '../../services/queryOptimizationService';
import {
  extractColumnRef,
  extractAliasMap,
  resolveAlias,
} from '../../utils/sqlParserUtils';
import { formatSchemaForGPT } from '../../utils/schemaUtils';
import pkg from 'node-sql-parser';
import 'dotenv/config';

const { Parser } = pkg;

const parser = new Parser();

const uri_string = process.env.TESTING_URI!;

if (!uri_string) {
  throw new Error('Uri string is missing.');
}

const metrics = {
  executionTime: 20,
  planningTime: 0.36,
  rowsReturned: 26657,
  actualLoops: 1,
  sharedHitBlocks: 123,
  sharedReadBlocks: 0,
  startupCost: 0,
  totalCost: 2641,
};

const testQueries = [
  'SELECT * FROM customers;',
  'SELECT * FROM orders WHERE customer_id IN (SELECT id FROM customers WHERE total_spent::numeric > 500);',
  'SELECT id, first_name, last_name, email FROM customers;',
  'SELECT customer_id, COUNT(*) FROM orders GROUP BY customer_id;',
  'SELECT * FROM order_items WHERE quantity::numeric > 5;',
  'SELECT * FROM orders o JOIN customers c ON o.customer_id = c.id;',
  'SELECT * FROM products WHERE price::numeric > (SELECT AVG(price::numeric) FROM products);',
  'SELECT * FROM employees WHERE salary::numeric > 50000;',
  'SELECT * FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN orders o ON oi.order_id = o.id;',
  `SELECT * FROM audit_log WHERE event_type = 'login';`,
  "SELECT * FROM customers WHERE created_at::date > '2023-01-01';",
  "SELECT * FROM products WHERE category = 'Electronics';",
  "SELECT * FROM employees WHERE department = 'Engineering';",
  "SELECT * FROM audit_log WHERE user_id::text = '123';",
  'SELECT * FROM order_items WHERE total_price::numeric > 100;',
  'SELECT * FROM products WHERE stock_quantity::numeric < 10;',
  "SELECT * FROM orders WHERE status = 'pending';",
  'SELECT * FROM customers WHERE loyalty_points::numeric > 500;',
  "SELECT * FROM employees WHERE hire_date::date > '2022-01-01';",
  'SELECT * FROM orders WHERE total_amount::numeric > 1000;',
  'SELECT department, COUNT(*) FROM employees GROUP BY department;',
  'SELECT category, AVG(price::numeric) FROM products GROUP BY category;',
  'SELECT status, COUNT(*), SUM(total_amount::numeric) FROM orders GROUP BY status;',
  'SELECT e.id, e.name, e.role, e.salary FROM employees e WHERE e.salary::numeric > 60000;',
  "SELECT o.id, o.order_date, o.status, o.total_amount FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.status = 'completed';",
  'SELECT p.product_name, p.category, p.price, oi.quantity FROM products p JOIN order_items oi ON p.id = oi.product_id;',
  'SELECT id, name, department FROM employees WHERE salary::numeric > (SELECT AVG(salary::numeric) FROM employees);',
  "SELECT id, product_name, price FROM products WHERE price::numeric > (SELECT AVG(price::numeric) FROM products) AND category = 'Electronics';",
];

async function runValidation() {
  let totalHallucinationsWithSchemaCount = 0;
  let totalHallucinationsWithoutSchemaCount = 0;
  let failedParseWithSchemaCounter = 0;
  let failedParseWithoutSchemaCounter = 0;

  for (const element of testQueries) {
    let hallucinatedWithSchema = [];
    let hallucinatedWithoutSchema = [];

    try {
      const tableNames = await fetchTableNames(uri_string, element);
      const schemaContexts = await fetchSchemaContext(uri_string, tableNames);
      const formattedSchema = formatSchemaForGPT(schemaContexts);

      const resultWithSchema = await optimizeQuery(
        element,
        metrics,
        formattedSchema,
      );
      const resultWithoutSchema = await optimizeQuery(
        element,
        metrics,
        'Schema context unavailable - optimize based on query structure only',
      );

      // Parsing steps with schema
      try {
        // Need to replace the ::
        const cleanedWithSchema = resultWithSchema.suggestedQuery.replace(
          /::[a-zA-Z]+/g,
          '',
        );
        const astWithSchema = parser.astify(cleanedWithSchema);
        const columnRefsWithSchema = extractColumnRef(astWithSchema);
        const firstStatementWithSchema = Array.isArray(astWithSchema)
          ? astWithSchema[0]
          : astWithSchema;
        const aliasMapWithSchema = extractAliasMap(firstStatementWithSchema);
        const parseWithSchema = resolveAlias(
          columnRefsWithSchema,
          aliasMapWithSchema,
        );

        const validRefsWithSchema = parseWithSchema.filter(
          (ref) =>
            ref.table !== null &&
            ref.table !== undefined &&
            !/^\d+$/.test(ref.column),
        );

        hallucinatedWithSchema = validRefsWithSchema.filter((ref) => {
          return !schemaContexts.some(
            (item) =>
              item.table_name === ref.table && item.column_name === ref.column,
          );
        });
      } catch (error) {
        console.error('Failed to parse WITH schema reuslt', error);
        failedParseWithSchemaCounter++;
      }

      // Parsing without schema
      try {
        const cleanedWithoutSchema = resultWithoutSchema.suggestedQuery.replace(
          /::[a-zA-Z]+/g,
          '',
        );
        const astWithoutSchema = parser.astify(cleanedWithoutSchema);
        const columnRefsWithoutSchema = extractColumnRef(astWithoutSchema);
        const firstStatementWithoutSchema = Array.isArray(astWithoutSchema)
          ? astWithoutSchema[0]
          : astWithoutSchema;
        const aliasMapWithoutSchema = extractAliasMap(
          firstStatementWithoutSchema,
        );
        const parseWithoutSchema = resolveAlias(
          columnRefsWithoutSchema,
          aliasMapWithoutSchema,
        );

        const validRefsWithoutSchema = parseWithoutSchema.filter(
          (ref) =>
            ref.table !== null &&
            ref.table !== undefined &&
            !/^\d+$/.test(ref.column),
        );

        hallucinatedWithoutSchema = validRefsWithoutSchema.filter((ref) => {
          return !schemaContexts.some(
            (item) =>
              item.table_name === ref.table && item.column_name === ref.column,
          );
        });
      } catch (error) {
        console.error('Failed to parse WITHOUT schema reuslt', error);
        failedParseWithoutSchemaCounter++;
      }
      console.log('Query: ', element);
      console.log(
        hallucinatedWithSchema.length === 0
          ? `WITH schema: PASS (${hallucinatedWithSchema.length} hallucinations)`
          : `WITH schema: FAIL (${hallucinatedWithSchema.length} hallucinations)`,
      );
      console.log(
        hallucinatedWithoutSchema.length === 0
          ? `WITHOUT schema: PASS (${hallucinatedWithoutSchema.length} hallucinations)`
          : `WITHOUT schema: FAIL (${hallucinatedWithoutSchema.length} hallucinations)`,
      );
      totalHallucinationsWithSchemaCount += hallucinatedWithSchema.length;
      totalHallucinationsWithoutSchemaCount += hallucinatedWithoutSchema.length;
    } catch (error) {
      console.error('Optimization for query failed: ', error);
    }
  }

  console.log('\n--- SUMMARY ---');
  console.log(
    'Total hallucinations WITH schema ',
    totalHallucinationsWithSchemaCount,
  );
  console.log(
    'Total hallucinations WITHOUT schema ',
    totalHallucinationsWithoutSchemaCount,
  );
  console.log(
    'Schema context reduced hallucination by ',
    totalHallucinationsWithoutSchemaCount - totalHallucinationsWithSchemaCount,
  );
  console.log('Failed parses WITH schema: ', failedParseWithSchemaCounter);
  console.log(
    'Failed parses WITHOUT schema: ',
    failedParseWithoutSchemaCounter,
  );
}

runValidation();
