import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { successResponse, ErrorResponses, registerSchema, loginSchema } from '@jobverse/shared';
import { prisma } from '../lib/prisma';
import { generateAccessToken, generateRefreshToken } from '../lib/jwt';

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

    // TODO: 实现实际的用户注册逻辑
    // const { email, password, name, role } = validationResult.data;
    
    // 模拟注册成功
    const mockUser = {
      id: 'mock-user-id',
      email: validationResult.data.email,
      name: validationResult.data.name,
      role: validationResult.data.role || 'STUDENT',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    res.status(201).json(successResponse(mockUser, '注册成功'));
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

    // TODO: 实现实际的Token刷新逻辑

    // 模拟刷新成功
    const mockResponse = {
      accessToken: 'new-mock-access-token',
      refreshToken: 'new-mock-refresh-token',
    };

    res.json(successResponse(mockResponse, '刷新成功'));
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
    // TODO: 实现实际的登出逻辑（如清除Redis中的Token）
    
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


