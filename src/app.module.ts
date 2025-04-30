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
import { WinstonModule } from 'nest-winston';
import { GraphQLError } from 'graphql';
import { CommonModule } from './common/common.module';
import { winstonConfig } from './config/winston.config'; // Import centralized config

@Module({
  imports: [
    CommonModule,
    WinstonModule.forRoot(winstonConfig), // Use imported config
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
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      imports: [CommonModule],
      useFactory: (errorFormatter: GraphQLErrorFormatter) => ({
        playground: false,
        plugins: [ApolloServerPluginLandingPageLocalDefault()],
        autoSchemaFile: true,
        formatError: (error: GraphQLError) => {
          return errorFormatter.formatError(error);
        },
      }),
      inject: [GraphQLErrorFormatter],
    }),
    AuthModule,
    UsersModule,
    DepartmentsModule,
  ],
  providers: [AppService, AppResolver],
})
export class AppModule {}
