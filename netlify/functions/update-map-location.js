if (body.password !== process.env.PRIVATE_PAGE_PASSWORD) {
  return {
    statusCode: 403,
    body: JSON.stringify({ message: 'Unauthorized' })
  };
}
