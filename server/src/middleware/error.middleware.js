const databaseErrors = {
    '23505': [409, 'Thông tin đã tồn tại hoặc yêu cầu đã được xử lý.'],
    '23P01': [409, 'Thời gian bị trùng. Vui lòng chọn khung giờ khác.'],
    '23503': [400, 'Dữ liệu liên quan không tồn tại hoặc đang được sử dụng.'],
    '23514': [400, 'Dữ liệu không thỏa điều kiện nghiệp vụ.'],
    '23502': [400, 'Thiếu thông tin bắt buộc.'],
    '22P02': [400, 'Định dạng dữ liệu không hợp lệ.'],
    '22007': [400, 'Ngày giờ không hợp lệ.'],
    '22008': [400, 'Ngày giờ không hợp lệ.'],
    '40001': [409, 'Dữ liệu vừa thay đổi. Vui lòng thử lại.'],
    '40P01': [409, 'Yêu cầu đồng thời bị xung đột. Vui lòng thử lại.'],
}
export function publicError(err) {
    if(err.status===503&&['QR_NOT_CONFIGURED','PAYMENT_NOT_CONFIGURED'].includes(err.code))return {status:503,message:err.message,code:err.code}
    if (databaseErrors[err.code]) {
        const [status, message] = databaseErrors[err.code]
        return { status, message }
    }
    if (err.name === 'ZodError') return { status: 422, message: 'Thông tin không hợp lệ.' }
    if (err.type === 'entity.parse.failed') return { status: 400, message: 'Nội dung JSON không hợp lệ.' }
    if (err.status >= 400 && err.status < 500) return { status: err.status, message: err.message }
    if (err.code === 'SCHEDULING_BUDGET') return { status: 503, message: 'Chưa thể kiểm tra công suất. Vui lòng thử lại.' }
    return { status: 500, message: 'Không thể xử lý yêu cầu. Vui lòng thử lại.' }
}
export function errorHandler(err, req, res, next) {
    if (res.headersSent) return next(err)
    const result = publicError(err)
    // Do not log SQL, connection strings, submitted data, password hashes or stacks.
    console.error('[error]', result.status, err.code || err.name || 'Error')
    res.status(result.status).json({ error: result.message, ...(result.code?{code:result.code}:{}) })
}
