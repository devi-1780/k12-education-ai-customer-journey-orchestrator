export class ApiResponse {
  constructor(success, message, data = null, meta = undefined) {
    this.success = success;
    this.message = message;
    this.data = data;
    if (meta !== undefined) this.meta = meta;
  }

  static ok(res, message, data = null, meta = undefined, status = 200) {
    return res.status(status).json(new ApiResponse(true, message, data, meta));
  }

  static created(res, message, data = null, meta = undefined) {
    return ApiResponse.ok(res, message, data, meta, 201);
  }
}
