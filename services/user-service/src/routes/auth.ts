import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { successResponse, ErrorResponses, registerSchema, loginSchema } from '@jobverse/shared';
import { prisma } from '../lib/prisma';
import { generateAccessToken, generateRefreshToken, verifyToken } from '../lib/jwt';

const router: Router = Router();

/**
 * 用户注册
 * POST /api/v1/auth/register
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // 验证请求数据
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(
        ErrorResponses.badRequest('参数验证失败', validationResult.error.message)
      );
    }

    const { email, password, name, role } = validationResult.data;

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      return res.status(400).json(
        ErrorResponses.badRequest('该邮箱已被注册')
      );
    }

    // 加密密码
    const passwordHash = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role || 'STUDENT',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 生成 Token
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
    });

    res.status(201).json(successResponse({
      user,
      accessToken,
      refreshToken,
    }, '注册成功'));
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 用户登录
 * POST /api/v1/auth/login
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // 验证请求数据
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(
        ErrorResponses.badRequest('参数验证失败', validationResult.error.message)
      );
    }

    const { email, password } = validationResult.data;

    // 查询用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 用户不存在或密码错误
    if (!user) {
      return res.status(401).json(
        ErrorResponses.unauthorized('邮箱或密码错误')
      );
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json(
        ErrorResponses.unauthorized('邮箱或密码错误')
      );
    }

    // 生成 Token
    const accessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    const refreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
    });

    // 返回用户信息（不包含密码）
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json(successResponse({
      user: userResponse,
      accessToken,
      refreshToken,
    }, '登录成功'));
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 刷新Token
 * POST /api/v1/auth/refresh
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json(ErrorResponses.badRequest('refreshToken 不能为空'));
    }

    // 验证 refreshToken
    let decoded;
    try {
      decoded = verifyToken(refreshToken);
    } catch {
      return res.status(401).json(ErrorResponses.unauthorized('Token 无效或已过期'));
    }

    // 检查是否为 refresh token
    if (decoded.type !== 'refresh') {
      return res.status(401).json(ErrorResponses.unauthorized('无效的 refreshToken'));
    }

    // 检查用户是否存在
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    if (!user) {
      return res.status(401).json(ErrorResponses.unauthorized('用户不存在'));
    }

    // 生成新的 Token
    const newAccessToken = generateAccessToken({
      userId: user.id,
      role: user.role,
    });
    const newRefreshToken = generateRefreshToken({
      userId: user.id,
      role: user.role,
    });

    res.json(successResponse({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }, '刷新成功'));
  } catch (error) {
    console.error('刷新Token失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 登出
 * POST /api/v1/auth/logout
 */
router.post('/logout', async (_req: Request, res: Response) => {
  try {
    // 当前使用无状态JWT，登出由前端清除Token
    // 如需实现Token黑名单，可在此将Token存入Redis
    res.json(successResponse(null, '登出成功'));
  } catch (error) {
    console.error('登出失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取当前用户信息
 * GET /api/v1/auth/me
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'];
    
    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    // 从数据库查询用户信息
    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json(
        ErrorResponses.notFound('用户不存在')
      );
    }

    res.json(successResponse(user));
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as authRouter };


