export async function onRequestPost(context) {
  try {
    const { password } = await context.request.json();
    
    // 获取 Cloudflare 环境变量
    const correctPassword = context.env.ADMIN_PASSWORD;

    if (password === correctPassword) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ success: false }), { status: 401 });
    }
  } catch (e) {
    return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
  }

}
