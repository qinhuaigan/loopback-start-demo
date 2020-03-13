module.exports = function(app) {
  const Role = app.models.Role;
  const AccessToken = app.models.AccessToken;
  const User = app.models.User;
  Role.registerResolver('$owner', function(role, context, cb) {
    const error = new Error()
    error.message = '需要授权'
    error.statusCode = 401
    // 当前账号是否属于 "$owner" 角色
    const token = context.remotingContext.req.query.token
    if (!token) return error
    return cb(null, true);
  });
};
