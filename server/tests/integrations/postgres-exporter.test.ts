await setDatabaseUriToPostgresExporter({
  userId: 'test-user-1',
  uri_string:
    'postgresql://testuser:testpass123@test_user_db:5432/testdb?sslmode=disable',
});
