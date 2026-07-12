
const successResponse = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, message = 'An error occurred', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };
  if (errors) {
    response.errors = errors;
  }
  return res.status(statusCode).json(response);
};

const paginateQuery = async (Model, query = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = { createdAt: -1 },
    populate = '',
    select = '',
  } = options;

  const skip = (page - 1) * limit;
  const total = await Model.countDocuments(query);

  let dbQuery = Model.find(query).sort(sort).skip(skip).limit(limit);
  if (populate) dbQuery = dbQuery.populate(populate);
  if (select) dbQuery = dbQuery.select(select);

  const docs = await dbQuery;

  return {
    docs,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

export { successResponse, errorResponse, paginateQuery };
