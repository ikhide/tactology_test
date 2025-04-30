import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { AppService } from './app.service';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { AppResolver } from './app.resolver';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { GraphQLErrorFormatter } from './common/formatters/graphql-error.formatter';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const config = {
          type: 'postgres' as const,
          host: 'localhost',
          port: 5432,
          username: 'postgres',
          password: 'postgres',
          database: 'postgres',
          autoLoadEntities: true,
          synchronize: true,
        };

        return config;
      },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      autoSchemaFile: true,
      formatError: (error) => {
        const formatter = new GraphQLErrorFormatter();
        return formatter.formatError(error as any);
      },
    }),
    AuthModule,
    UsersModule,
    DepartmentsModule,
  ],
  providers: [AppService, AppResolver],
})
export class AppModule {}
